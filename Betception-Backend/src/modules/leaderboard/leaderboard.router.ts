import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { LeaderboardQuerySchema } from './leaderboard.schema.js';
import {
  getBalanceLeaderboard,
  getLevelLeaderboard,
  getWeeklyWinningsLeaderboard,
} from './leaderboard.controller.js';

export const leaderboardRouter = Router();

leaderboardRouter.use(authGuard);
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

