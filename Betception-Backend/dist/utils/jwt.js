import * as jose from 'jose';
import { env } from '../config/env.js';
const enc = (s) => new TextEncoder().encode(s);
function ensureAuthPayload(payload) {
    if (!payload.sub || typeof payload.email !== 'string' || typeof payload.username !== 'string') {
        throw new Error('Invalid auth payload');
    }
}
export async function signAccess(payload) {
    if (!payload || Object.keys(payload).length === 0)
        throw new Error('Cannot sign empty payload');
    return await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${env.jwt.accessTtlMin}m`)
        .sign(enc(env.jwt.accessSecret));
}
export async function signRefresh(payload) {
    if (!payload || Object.keys(payload).length === 0)
        throw new Error('Cannot sign empty payload');
    return await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${env.jwt.refreshTtlDays}d`)
        .sign(enc(env.jwt.refreshSecret));
}
export async function verifyAccess(token) {
    const { payload } = await jose.jwtVerify(token, enc(env.jwt.accessSecret));
    ensureAuthPayload(payload);
    return payload;
}
export async function verifyRefresh(token) {
    const { payload } = await jose.jwtVerify(token, enc(env.jwt.refreshSecret));
    ensureAuthPayload(payload);
    return payload;
}
