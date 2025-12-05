import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../utils/jwt.js';

export async function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const allowGuest =
      req.method === 'GET' && typeof req.baseUrl === 'string' && req.baseUrl.startsWith('/leaderboard');

    if (req.user) {
      return next();
    }
    const header = req.header('Authorization');

    if (!header?.startsWith('Bearer ')) {
      if (allowGuest) {
        return next();
      }
      throw new Error('Missing token');
    }
    const token = header.substring(7);
    const payload = await verifyAccess(token);
    req.user = payload;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid or expired token';
    return res.status(401).json({ message });
  }
}
