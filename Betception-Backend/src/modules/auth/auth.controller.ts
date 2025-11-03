import { Request, Response } from 'express';
import { pool } from '../../db/pool.js';
import { hashPassword, verifyPassword } from '../../utils/passwords.js';
import { signAccess, signRefresh, verifyRefresh } from '../../utils/jwt.js';
import { env } from '../../config/env.js';
import { RegisterSchema, LoginSchema } from './auth.schema.js';

export async function register(req: Request, res: Response) {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const { email, password, username } = parsed.data;

  const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if ((exists as any[]).length) return res.status(409).json({ message: 'Email already in use' });

  const pwHash = await hashPassword(password);
  await pool.query('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)', [email, username, pwHash]);

  return res.status(201).json({ message: 'Registered' });
}

export async function login(req: Request, res: Response) {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const [rows] = await pool.query('SELECT id, email, username, password_hash FROM users WHERE email = ?', [email]);
  const user = (rows as any[])[0];
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const subject = { sub: user.id, email: user.email, username: user.username };
  const accessToken = await signAccess(subject);
  const refreshToken = await signRefresh(subject);

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true, secure: env.cookies.secure, sameSite: 'lax',
    path: '/auth/refresh',
    maxAge: env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000
  });

  return res.json({ accessToken });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ message: 'Missing refresh token' });
  try {
    const payload = await verifyRefresh(token);
    const accessToken = await signAccess({ sub: payload.sub, email: payload.email, username: payload.username });
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('refresh_token', { path: '/auth/refresh' });
  res.status(204).send();
}
