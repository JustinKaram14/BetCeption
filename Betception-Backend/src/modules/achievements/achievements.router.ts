import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import {
  claimOwnAchievementReward,
  listOwnAchievements,
  markOwnAchievementsSeen,
} from './achievements.controller.js';

export const achievementsRouter = Router();

achievementsRouter.use(authGuard);
achievementsRouter.get('/', listOwnAchievements);
achievementsRouter.post('/seen', markOwnAchievementsSeen);
achievementsRouter.post('/:code/claim', claimOwnAchievementReward);
