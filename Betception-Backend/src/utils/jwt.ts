import * as jose from 'jose';
import { env } from '../config/env.js';

const enc = (s: string) => new TextEncoder().encode(s);

export async function signAccess(payload: object) {
  return await new jose.SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${env.jwt.accessTtlMin}m`)
    .sign(enc(env.jwt.accessSecret));
}
export async function signRefresh(payload: object) {
  return await new jose.SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${env.jwt.refreshTtlDays}d`)
    .sign(enc(env.jwt.refreshSecret));
}
export async function verifyAccess(token: string) {
  const { payload } = await jose.jwtVerify(token, enc(env.jwt.accessSecret));
  return payload;
}
export async function verifyRefresh(token: string) {
  const { payload } = await jose.jwtVerify(token, enc(env.jwt.refreshSecret));
  return payload;
}
