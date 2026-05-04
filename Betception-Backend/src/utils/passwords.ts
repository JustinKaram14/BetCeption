import bcrypt from 'bcrypt';
const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
