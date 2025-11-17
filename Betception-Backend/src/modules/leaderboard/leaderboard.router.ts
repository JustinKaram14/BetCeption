import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { LeaderboardQuerySchema } from './leaderboard.schema.js';
import {
  getBalanceLeaderboard,
  getLevelLeaderboard,
  getWeeklyWinningsLeaderboard,
} from './leaderboard.controller.js';
import { verifyAccess } from '../../utils/jwt.js';

export const leaderboardRouter = Router();

leaderboardRouter.use(async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.header('Authorization');
    if (!header?.startsWith('Bearer ')) {
      return next();
    }
    const token = header.slice(7);
    const payload = await verifyAccess(token);
    req.user = payload;
  } catch {
    // Ignore invalid tokens since the endpoint is public.
  }
  return next();
});
leaderboardRouter.get(
  '/balance',
  validateRequest(LeaderboardQuerySchema, 'query'),
  getBalanceLeaderboard,
);
leaderboardRouter.get(
  '/level',
  validateRequest(LeaderboardQuerySchema, 'query'),
  getLevelLeaderboard,
);
leaderboardRouter.get(
  '/winnings',
  validateRequest(LeaderboardQuerySchema, 'query'),
  getWeeklyWinningsLeaderboard,
);

