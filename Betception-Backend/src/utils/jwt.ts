import * as jose from 'jose';
import { env } from '../config/env.js';

const enc = (s: string) => new TextEncoder().encode(s);

export type AuthSubject = {
  sub: string | number;
  email: string;
  username: string;
};

export type AuthTokenPayload = jose.JWTPayload & AuthSubject;

function ensureAuthPayload(payload: jose.JWTPayload): asserts payload is AuthTokenPayload {
  if (!payload.sub || typeof payload.email !== 'string' || typeof payload.username !== 'string') {
    throw new Error('Invalid auth payload');
  }
}

export async function signAccess(payload: AuthSubject) {
  if (!payload || Object.keys(payload).length === 0) throw new Error('Cannot sign empty payload');
  return await new jose.SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${env.jwt.accessTtlMin}m`)
    .sign(enc(env.jwt.accessSecret));
}

export async function signRefresh(payload: AuthSubject) {
  if (!payload || Object.keys(payload).length === 0) throw new Error('Cannot sign empty payload');
  return await new jose.SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${env.jwt.refreshTtlDays}d`)
    .sign(enc(env.jwt.refreshSecret));
}

export async function verifyAccess(token: string) {
  const { payload } = await jose.jwtVerify(token, enc(env.jwt.accessSecret));
  ensureAuthPayload(payload);
  return payload;
}

export async function verifyRefresh(token: string) {
  const { payload } = await jose.jwtVerify(token, enc(env.jwt.refreshSecret));
  ensureAuthPayload(payload);
  return payload;
}
