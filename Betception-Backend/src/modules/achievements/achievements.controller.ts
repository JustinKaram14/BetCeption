import { Request, Response } from 'express';
import { AppDataSource } from '../../db/data-source.js';
import {
  AchievementClaimError,
  claimAchievementReward,
  listAchievementsForUser,
  markAchievementsSeen,
} from './achievements.service.js';

export async function listOwnAchievements(req: Request, res: Response) {
  const userId = String(req.user?.sub ?? '');
  if (!userId) {
    return res.status(401).json({ message: 'Unauthenticated', code: 'UNAUTHENTICATED' });
  }

  const payload = await listAchievementsForUser(userId, AppDataSource.manager);
  return res.json(payload);
}

export async function markOwnAchievementsSeen(req: Request, res: Response) {
  const userId = String(req.user?.sub ?? '');
  if (!userId) {
    return res.status(401).json({ message: 'Unauthenticated', code: 'UNAUTHENTICATED' });
  }

  const payload = await markAchievementsSeen(userId, AppDataSource.manager);
  return res.json(payload);
}

export async function claimOwnAchievementReward(req: Request, res: Response) {
  const userId = String(req.user?.sub ?? '');
  if (!userId) {
    return res.status(401).json({ message: 'Unauthenticated', code: 'UNAUTHENTICATED' });
  }

  const achievementCode = String(req.params.code ?? '').trim();
  if (!achievementCode) {
    return res.status(400).json({ message: 'Achievement code is required', code: 'ACHIEVEMENT_CODE_REQUIRED' });
  }

  try {
    const payload = await AppDataSource.transaction((manager) =>
      claimAchievementReward(userId, achievementCode, manager),
    );
    return res.json(payload);
  } catch (error) {
    if (error instanceof AchievementClaimError) {
      return res.status(error.status).json({ message: error.message, code: error.code });
    }
    throw error;
  }
}
