import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../utils/jwt.js';

const BEARER_PREFIX = 'Bearer ';

export async function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const allowGuest =
      req.method === 'GET' && typeof req.baseUrl === 'string' && req.baseUrl.startsWith('/leaderboard');

    if (req.user) {
      return next();
    }
    const header = req.header('Authorization');

    if (!header?.startsWith(BEARER_PREFIX)) {
      if (allowGuest) {
        return next();
      }
      throw new Error('Missing token');
    }
    const token = header.slice(BEARER_PREFIX.length);
    const payload = await verifyAccess(token);
    req.user = payload;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid or expired token';
    return res.status(401).json({ message });
  }
}
