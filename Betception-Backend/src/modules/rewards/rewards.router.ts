import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { claimDailyReward } from './rewards.controller.js';

export const rewardsRouter = Router();

rewardsRouter.post('/daily/claim', authGuard, claimDailyReward);

