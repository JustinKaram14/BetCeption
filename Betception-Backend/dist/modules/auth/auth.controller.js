import { AppDataSource } from '../../db/data-source.js';
import { User } from '../../entity/User.js';
import { Session } from '../../entity/Session.js';
import { hashPassword, verifyPassword } from '../../utils/passwords.js';
import { signAccess, signRefresh, verifyRefresh } from '../../utils/jwt.js';
import { env } from '../../config/env.js';
import { hashToken } from '../../utils/tokenHash.js';
const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/auth/refresh';
const REFRESH_TTL_MS = env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000;
const refreshCookieDefaults = {
    httpOnly: true,
    secure: env.cookies.secure,
    sameSite: env.cookies.sameSite,
    path: REFRESH_COOKIE_PATH,
};
function setRefreshTokenCookie(res, token) {
    res.cookie(REFRESH_COOKIE_NAME, token, {
        ...refreshCookieDefaults,
        maxAge: REFRESH_TTL_MS,
    });
}
function clearRefreshTokenCookie(res) {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieDefaults);
}
export async function register(req, res) {
    const { email, password, username } = req.body;
    const repo = AppDataSource.getRepository(User);
    const emailExists = await repo.exist({ where: { email } });
    if (emailExists)
        return res.status(409).json({ message: 'Email already in use' });
    const usernameExists = await repo.exist({ where: { username } });
    if (usernameExists)
        return res.status(409).json({ message: 'Username already in use' });
    const pwHash = await hashPassword(password);
    const startingBalance = Number.isFinite(env.users.initialBalance) ? env.users.initialBalance : 0;
    const user = repo.create({
        email,
        username,
        passwordHash: pwHash,
        balance: startingBalance.toFixed(2),
    });
    await repo.save(user);
    return res.status(201).json({ message: 'Registered' });
}
export async function login(req, res) {
    const { email, password } = req.body;
    const repo = AppDataSource.getRepository(User);
    const sessionRepo = AppDataSource.getRepository(Session);
    const user = await repo.findOne({ select: ['id', 'email', 'username', 'passwordHash'], where: { email } });
    const invalidResponse = { message: 'Invalid email or password' };
    if (!user)
        return res.status(401).json(invalidResponse);
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok)
        return res.status(401).json(invalidResponse);
    await repo.update(user.id, { lastLoginAt: new Date() });
    const subject = { sub: user.id, email: user.email, username: user.username };
    const accessToken = await signAccess(subject);
    const refreshToken = await signRefresh(subject);
    const refreshExpiresAt = new Date(Date.now() + env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000);
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
export async function refresh(req, res) {
    const token = req.cookies?.refresh_token;
    if (!token)
        return res.status(401).json({ message: 'Missing refresh token' });
    try {
        const payload = await verifyRefresh(token);
        const repo = AppDataSource.getRepository(User);
        const sessionRepo = AppDataSource.getRepository(Session);
        if (!payload.sub)
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        const userId = String(payload.sub);
        const session = await sessionRepo.findOne({
            where: { refreshToken: hashToken(token) },
            relations: ['user'],
        });
        if (!session || !session.user || session.expiresAt < new Date() || session.user.id !== userId) {
            if (session?.id)
                await sessionRepo.delete(session.id);
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }
        const user = await repo.findOne({
            where: { id: userId },
            select: ['id', 'email', 'username'],
        });
        if (!user)
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        const subject = { sub: user.id, email: user.email, username: user.username };
        const accessToken = await signAccess(subject);
        const newRefreshToken = await signRefresh(subject);
        const refreshExpiresAt = new Date(Date.now() + env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000);
        session.refreshToken = hashToken(newRefreshToken);
        session.expiresAt = refreshExpiresAt;
        session.userAgent = req.headers['user-agent']?.slice(0, 255) ?? session.userAgent;
        session.ip = req.ip ?? session.ip;
        await sessionRepo.save(session);
        setRefreshTokenCookie(res, newRefreshToken);
        return res.json({ accessToken });
    }
    catch (err) {
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
}
export async function logout(req, res) {
    const token = req.cookies?.refresh_token;
    if (token) {
        const sessionRepo = AppDataSource.getRepository(Session);
        await sessionRepo.delete({ refreshToken: hashToken(token) });
    }
    clearRefreshTokenCookie(res);
    res.status(204).send();
}
