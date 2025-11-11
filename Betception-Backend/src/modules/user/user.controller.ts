import { Request, Response } from 'express';
import { AppDataSource } from '../../db/data-source.js';
import { User } from '../../entity/User.js';
import type { UserIdParams } from './user.schema.js';

export function getCurrentUser(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthenticated' });
  }
  return res.json({ user: req.user });
}

export async function getUserById(
  req: Request<UserIdParams>,
  res: Response,
) {
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({
    where: { id: req.params.id },
    select: ['id', 'username', 'email', 'balance', 'xp', 'level'],
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user });
}
