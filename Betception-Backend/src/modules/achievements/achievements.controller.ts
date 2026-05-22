import { Request, Response } from 'express';
import { AppDataSource } from '../../db/data-source.js';
import {
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
