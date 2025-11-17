import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../utils/jwt.js';

export async function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user) {
      return next();
    }
    const header = req.header('Authorization');
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });
    const token = header.substring(7);
    const payload = await verifyAccess(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
