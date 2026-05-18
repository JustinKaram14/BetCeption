import { randomBytes } from 'crypto';
import type { Request, Response, CookieOptions } from 'express';
import { AppDataSource } from '../../db/data-source.js';
import { User } from '../../entity/User.js';
import { Session } from '../../entity/Session.js';
import { hashPassword, verifyPassword } from '../../utils/passwords.js';
import { signAccess, signRefresh, verifyRefresh } from '../../utils/jwt.js';
import { env } from '../../config/env.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';
import { hashToken } from '../../utils/tokenHash.js';
import * as emailValidation from './email-validation.js';
import { sendVerificationEmail } from '../../utils/mailer.js';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/auth/refresh';
const REFRESH_TTL_MS = env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';
const REGISTRATION_CONFLICT_MESSAGE = 'Registration could not be completed';
const DUMMY_PASSWORD_HASH = '$2b$12$K/V.sNBjQhL3tgXD7I0r4.nmt.V3a5QCdJpRCFfcAY62w27j/Skrq';

const refreshCookieDefaults: CookieOptions = {
  httpOnly: true,
  secure: env.cookies.secure,
  sameSite: env.cookies.sameSite,
  path: REFRESH_COOKIE_PATH,
};

function setRefreshTokenCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...refreshCookieDefaults,
    maxAge: REFRESH_TTL_MS,
  });
}

function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

export async function register(
  req: Request<unknown, unknown, RegisterInput>,
  res: Response,
) {
  const { email, password, username } = req.body;
  const emailValidationResult = await emailValidation.validateRegistrableEmail(email);
  if (!emailValidationResult.valid) {
    return res.status(400).json({
      message: emailValidationResult.message,
      code: emailValidationResult.code,
    });
  }

  const repo = AppDataSource.getRepository(User);

  const emailExists = await repo.exist({ where: { email } });
  if (emailExists) return res.status(409).json({ message: REGISTRATION_CONFLICT_MESSAGE });

  const usernameExists = await repo.exist({ where: { username } });
  if (usernameExists) return res.status(409).json({ message: REGISTRATION_CONFLICT_MESSAGE });

  const pwHash = await hashPassword(password);
  const startingBalance = Number.isFinite(env.users.initialBalance) ? env.users.initialBalance : 0;

  const smtpConfigured = !!env.smtp;
  const verificationToken = smtpConfigured ? randomBytes(32).toString('hex') : null;
  const verificationTokenExpiresAt = smtpConfigured
    ? new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS)
    : null;

  const user = repo.create({
    email,
    username,
    passwordHash: pwHash,
    balance: startingBalance.toFixed(2),
    emailVerified: !smtpConfigured,
    emailVerificationToken: verificationToken,
    emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
  });
  await repo.save(user);

  if (smtpConfigured && verificationToken) {
    try {
      await sendVerificationEmail(email, username, verificationToken);
    } catch {
      // Mail-Fehler nicht zum Nutzer durchreichen — Account wurde erstellt
    }
  }

  return res.status(201).json({ message: 'Registered' });
}

export async function login(
  req: Request<unknown, unknown, LoginInput>,
  res: Response,
) {
  const { email, password } = req.body;
  const repo = AppDataSource.getRepository(User);
  const sessionRepo = AppDataSource.getRepository(Session);
  const user = await repo.findOne({
    select: ['id', 'email', 'username', 'passwordHash', 'emailVerified'],
    where: { email },
  });
  if (!user) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    return res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });
  }

  if (!user.emailVerified) {
    return res.status(403).json({
      message: 'Please verify your email address before logging in.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }

  await repo.update(user.id, { lastLoginAt: new Date() });

  const subject = { sub: user.id, email: user.email, username: user.username };
  const accessToken = await signAccess(subject);
  const refreshToken = await signRefresh(subject);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  setRefreshTokenCookie(res, refreshToken);

  await sessionRepo.save(sessionRepo.create({
    user,
    refreshToken: hashToken(refreshToken),
    userAgent: req.headers['user-agent']?.slice(0, 255) ?? null,
    ip: req.ip ?? null,
    expiresAt: refreshExpiresAt,
  }));

  return res.json({ accessToken });
}

export async function verifyEmail(req: Request, res: Response) {
  const token = typeof req.query['token'] === 'string' ? req.query['token'] : null;
  if (!token) {
    return res.status(400).json({ message: 'Missing verification token', code: 'TOKEN_MISSING' });
  }

  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({
    where: { emailVerificationToken: token },
    select: ['id', 'emailVerified', 'emailVerificationToken', 'emailVerificationTokenExpiresAt'],
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid verification token', code: 'TOKEN_INVALID' });
  }

  if (user.emailVerified) {
    return res.json({ message: 'Email already verified' });
  }

  if (!user.emailVerificationTokenExpiresAt || user.emailVerificationTokenExpiresAt < new Date()) {
    return res.status(400).json({ message: 'Verification link has expired', code: 'TOKEN_EXPIRED' });
  }

  await repo.update(user.id, {
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationTokenExpiresAt: null,
  });

  return res.json({ message: 'Email verified successfully' });
}

export async function resendVerification(req: Request, res: Response) {
  const email = typeof req.body?.email === 'string' ? req.body.email : null;

  // Always return 200 to avoid user-enumeration
  if (!email) {
    return res.json({ message: 'Verification email sent if account exists' });
  }

  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({
    where: { email },
    select: ['id', 'email', 'username', 'emailVerified'],
  });

  if (!user || user.emailVerified) {
    return res.json({ message: 'Verification email sent if account exists' });
  }

  const verificationToken = randomBytes(32).toString('hex');
  const verificationTokenExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await repo.update(user.id, {
    emailVerificationToken: verificationToken,
    emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
  });

  try {
    await sendVerificationEmail(user.email, user.username, verificationToken);
  } catch {
    // Fehler nicht nach außen geben
  }

  return res.json({ message: 'Verification email sent if account exists' });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ message: 'Missing refresh token' });

  try {
    const payload = await verifyRefresh(token);
    const repo = AppDataSource.getRepository(User);
    const sessionRepo = AppDataSource.getRepository(Session);
    if (!payload.sub) return res.status(401).json({ message: 'Invalid or expired refresh token' });
    const userId = String(payload.sub);
    const session = await sessionRepo.findOne({
      where: { refreshToken: hashToken(token) },
      relations: ['user'],
    });
    if (!session || !session.user || session.expiresAt < new Date() || session.user.id !== userId) {
      if (session?.id) await sessionRepo.delete(session.id);
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await repo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'username'],
    });
    if (!user) return res.status(401).json({ message: 'Invalid or expired refresh token' });

    const subject = { sub: user.id, email: user.email, username: user.username };
    const accessToken = await signAccess(subject);
    const newRefreshToken = await signRefresh(subject);
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    session.refreshToken = hashToken(newRefreshToken);
    session.expiresAt = refreshExpiresAt;
    session.userAgent = req.headers['user-agent']?.slice(0, 255) ?? session.userAgent;
    session.ip = req.ip ?? session.ip;
    await sessionRepo.save(session);

    setRefreshTokenCookie(res, newRefreshToken);

    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.refresh_token;
  if (token) {
    const sessionRepo = AppDataSource.getRepository(Session);
    await sessionRepo.delete({ refreshToken: hashToken(token) });
  }
  clearRefreshTokenCookie(res);
  res.status(204).send();
}
