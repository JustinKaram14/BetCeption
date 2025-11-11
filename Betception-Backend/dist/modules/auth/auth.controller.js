import { AppDataSource } from '../../db/data-source.js';
import { User } from '../../entity/User.js';
import { Session } from '../../entity/Session.js';
import { hashPassword, verifyPassword } from '../../utils/passwords.js';
import { signAccess, signRefresh, verifyRefresh } from '../../utils/jwt.js';
import { env } from '../../config/env.js';
import { hashToken } from '../../utils/tokenHash.js';
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
    const user = repo.create({ email, username, passwordHash: pwHash });
    await repo.save(user);
    return res.status(201).json({ message: 'Registered' });
}
export async function login(req, res) {
    const { email, password } = req.body;
    const repo = AppDataSource.getRepository(User);
    const sessionRepo = AppDataSource.getRepository(Session);
    // Note: It is generally recommended to use a generic error message for both
    // invalid email and invalid password to prevent user enumeration attacks.
    // However, for this specific case, we are returning a more specific message.
    const user = await repo.findOne({ select: ['id', 'email', 'username', 'passwordHash'], where: { email } });
    if (!user)
        return res.status(401).json({ message: 'User not found' });
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ message: 'Invalid credentials' });
    await repo.update(user.id, { lastLoginAt: new Date() });
    const subject = { sub: user.id, email: user.email, username: user.username };
    const accessToken = await signAccess(subject);
    const refreshToken = await signRefresh(subject);
    const refreshExpiresAt = new Date(Date.now() + env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000);
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true, secure: env.cookies.secure, sameSite: 'lax',
        path: '/auth/refresh',
        maxAge: env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000
    });
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
        res.cookie('refresh_token', newRefreshToken, {
            httpOnly: true, secure: env.cookies.secure, sameSite: 'lax',
            path: '/auth/refresh',
            maxAge: env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000
        });
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
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    res.status(204).send();
}
