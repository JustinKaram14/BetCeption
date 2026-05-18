import { Request, Response } from 'express';
import { IsNull } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { User } from '../../entity/User.js';
import { Session } from '../../entity/Session.js';
import { hashPassword, verifyPassword } from '../../utils/passwords.js';
import { buildLevelProgress } from '../progression/progression.js';
import type {
  ChangeOwnPasswordInput,
  DeleteOwnAccountInput,
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
    avatarIcon: user.avatarIcon,
    avatarColor: user.avatarColor,
    levelProgress: buildLevelProgress(user),
    createdAt: user.createdAt,
  };
}

function serializePublicProfile(user: User) {
  return {
    id: user.id,
    username: user.username,
    balance: Number(user.balance),
    xp: user.xp,
    level: user.level,
    avatarIcon: user.avatarIcon,
    avatarColor: user.avatarColor,
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
    where: { id: req.params.id, deletedAt: IsNull() },
    select: ['id', 'username', 'balance', 'xp', 'level', 'avatarIcon', 'avatarColor', 'createdAt'],
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: serializePublicProfile(user) });
}

export async function getOwnProfile(req: Request, res: Response) {
  const userId = String(req.user?.sub);
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({
    where: { id: userId, deletedAt: IsNull() },
    select: ['id', 'username', 'email', 'balance', 'xp', 'level', 'avatarIcon', 'avatarColor', 'createdAt'],
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
    where: { id: userId, deletedAt: IsNull() },
    select: ['id', 'username', 'email', 'balance', 'xp', 'level', 'avatarIcon', 'avatarColor', 'createdAt'],
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const nextUsername = req.body.username;
  const nextEmail = req.body.email;
  const nextAvatarIcon = req.body.avatarIcon;
  const nextAvatarColor = req.body.avatarColor;

  if (nextUsername !== undefined && nextUsername !== user.username) {
    const existing = await repo.findOne({
      where: { username: nextUsername, deletedAt: IsNull() },
      select: ['id'],
    });
    if (existing && existing.id !== userId) {
      return res.status(409).json({ message: PROFILE_CONFLICT_MESSAGE });
    }
    user.username = nextUsername;
  }

  if (nextEmail !== undefined && nextEmail !== user.email) {
    const existing = await repo.findOne({
      where: { email: nextEmail, deletedAt: IsNull() },
      select: ['id'],
    });
    if (existing && existing.id !== userId) {
      return res.status(409).json({ message: PROFILE_CONFLICT_MESSAGE });
    }
    user.email = nextEmail;
  }

  if (nextAvatarIcon !== undefined) {
    user.avatarIcon = nextAvatarIcon;
  }

  if (nextAvatarColor !== undefined) {
    user.avatarColor = nextAvatarColor;
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
    where: { id: userId, deletedAt: IsNull() },
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

  await repo.update(user.id, {
    passwordHash: await hashPassword(req.body.newPassword),
    passwordChangedAt: new Date(),
  });

  return res.json({ success: true });
}

export async function deleteOwnAccount(
  req: Request<unknown, unknown, DeleteOwnAccountInput>,
  res: Response,
) {
  const userId = String(req.user?.sub);
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({
    where: { id: userId, deletedAt: IsNull() },
    select: ['id', 'passwordHash'],
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const passwordMatches = await verifyPassword(req.body.password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(400).json({
      message: 'Password is incorrect',
      code: 'INVALID_PASSWORD',
    });
  }

  const deletedAt = new Date();
  await AppDataSource.transaction(async (manager) => {
    const transactionalUserRepo = manager.getRepository(User);
    const sessionRepo = manager.getRepository(Session);
    await sessionRepo.delete({ user: { id: userId } });
    await transactionalUserRepo.update(userId, {
      username: `deleted-user-${userId}`,
      email: `deleted-user-${userId}@deleted.betception.local`,
      deletedAt,
      activePowerupType: null,
      activePowerupUsesRemaining: 0,
    });
  });

  return res.json({ success: true });
}
