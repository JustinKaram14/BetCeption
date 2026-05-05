import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { claimDailyReward, getDailyRewardStatus } from './rewards.controller.js';

export const rewardsRouter = Router();

rewardsRouter.get('/daily/status', authGuard, getDailyRewardStatus);
rewardsRouter.post('/daily/claim', authGuard, claimDailyReward);

