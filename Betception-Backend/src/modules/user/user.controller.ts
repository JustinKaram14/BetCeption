import { Request, Response } from 'express';
import { AppDataSource } from '../../db/data-source.js';
import { User } from '../../entity/User.js';
import { hashPassword, verifyPassword } from '../../utils/passwords.js';
import { buildLevelProgress } from '../progression/progression.js';
import type {
  ChangeOwnPasswordInput,
  UpdateOwnProfileInput,
  UserIdParams,
} from './user.schema.js';

const PROFILE_CONFLICT_MESSAGE = 'Profile update could not be completed';

function serializeProfile(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    balance: Number(user.balance),
    xp: user.xp,
    level: user.level,
    levelProgress: buildLevelProgress(user),
    createdAt: user.createdAt,
  };
}

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

  return res.json({ user: { ...user, levelProgress: buildLevelProgress(user) } });
}

export async function getOwnProfile(req: Request, res: Response) {
  const userId = String(req.user?.sub);
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({
    where: { id: userId },
    select: ['id', 'username', 'email', 'balance', 'xp', 'level', 'createdAt'],
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: serializeProfile(user) });
}

export async function updateOwnProfile(
  req: Request<unknown, unknown, UpdateOwnProfileInput>,
  res: Response,
) {
  const userId = String(req.user?.sub);
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({
    where: { id: userId },
    select: ['id', 'username', 'email', 'balance', 'xp', 'level', 'createdAt'],
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const nextUsername = req.body.username;
  const nextEmail = req.body.email;

  if (nextUsername !== undefined && nextUsername !== user.username) {
    const existing = await repo.findOne({
      where: { username: nextUsername },
      select: ['id'],
    });
    if (existing && existing.id !== userId) {
      return res.status(409).json({ message: PROFILE_CONFLICT_MESSAGE });
    }
    user.username = nextUsername;
  }

  if (nextEmail !== undefined && nextEmail !== user.email) {
    const existing = await repo.findOne({
      where: { email: nextEmail },
      select: ['id'],
    });
    if (existing && existing.id !== userId) {
      return res.status(409).json({ message: PROFILE_CONFLICT_MESSAGE });
    }
    user.email = nextEmail;
  }

  const saved = await repo.save(user);
  return res.json({ user: serializeProfile(saved) });
}

export async function changeOwnPassword(
  req: Request<unknown, unknown, ChangeOwnPasswordInput>,
  res: Response,
) {
  const userId = String(req.user?.sub);
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({
    where: { id: userId },
    select: ['id', 'passwordHash'],
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const currentPasswordMatches = await verifyPassword(
    req.body.currentPassword,
    user.passwordHash,
  );
  if (!currentPasswordMatches) {
    return res.status(400).json({
      message: 'Current password is incorrect',
      code: 'INVALID_CURRENT_PASSWORD',
    });
  }

  user.passwordHash = await hashPassword(req.body.newPassword);
  await repo.save(user);

  return res.json({ success: true });
}
