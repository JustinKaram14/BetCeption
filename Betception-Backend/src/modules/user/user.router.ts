import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';

export const userRouter = Router();
userRouter.get('/me', authGuard, (req, res) => {
  res.json({ user: (req as any).user });
});
