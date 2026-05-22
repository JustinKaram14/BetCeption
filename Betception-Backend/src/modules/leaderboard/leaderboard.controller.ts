import { Request, Response } from 'express';
import { EntityTarget, FindOptionsOrder, ObjectLiteral } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { LeaderboardBalanceView } from '../../entity/LeaderboardBalanceView.js';
import { LeaderboardLevelView } from '../../entity/LeaderboardLevelView.js';
import { LeaderboardAlltimeWinningsView } from '../../entity/LeaderboardAlltimeWinningsView.js';
import { LeaderboardWeeklyBalanceView } from '../../entity/LeaderboardWeeklyBalanceView.js';
import { LeaderboardWeeklyLevelView } from '../../entity/LeaderboardWeeklyLevelView.js';
import { LeaderboardWeeklyWinningsView } from '../../entity/LeaderboardWeeklyWinningsView.js';
import type { LeaderboardQuery } from './leaderboard.schema.js';

type LeaderboardOptions<T extends ObjectLiteral> = {
  entity: EntityTarget<T>;
  order: FindOptionsOrder<T>;
  mapRow: (row: T) => Record<string, unknown>;
  getUserId: (row: T) => string;
};

async function respondWithLeaderboard<T extends ObjectLiteral>(
  req: Request,
  res: Response,
  options: LeaderboardOptions<T>,
) {
  const { limit, offset } = req.query as unknown as LeaderboardQuery;
  const repo = AppDataSource.getRepository(options.entity);
  const [rows, total] = await repo.findAndCount({
    order: options.order,
    take: limit,
    skip: offset,
  });

  const items = rows.map((row, idx) => ({
    rank: offset + idx + 1,
    ...options.mapRow(row),
  }));

  const currentUserId = req.user?.sub ? String(req.user.sub) : null;
  const currentItem = currentUserId
    ? rows.find((row) => options.getUserId(row) === currentUserId)
    : null;
  const currentUserRank = currentItem
    ? offset + rows.indexOf(currentItem) + 1
    : null;

  return res.json({
    total,
    limit,
    offset,
    items,
    currentUserRank,
  });
}

export function getBalanceLeaderboard(req: Request, res: Response) {
  const period = (req.query as unknown as LeaderboardQuery).period ?? 'alltime';
  if (period === 'seven_days') {
    return respondWithLeaderboard(
      req,
      res,
      {
        entity: LeaderboardWeeklyBalanceView,
        order: { balance7d: 'DESC' },
        mapRow: (row) => ({
          userId: row.userId,
          username: row.username,
          balance7d: Number(row.balance7d),
        }),
        getUserId: (row) => row.userId,
      },
    );
  }

  return respondWithLeaderboard(
    req,
    res,
    {
      entity: LeaderboardBalanceView,
      order: { balance: 'DESC' },
      mapRow: (row) => ({
        userId: row.userId,
        username: row.username,
        balance: Number(row.balance),
      }),
      getUserId: (row) => row.userId,
    },
  );
}

export function getLevelLeaderboard(req: Request, res: Response) {
  const period = (req.query as unknown as LeaderboardQuery).period ?? 'alltime';
  if (period === 'seven_days') {
    return respondWithLeaderboard(
      req,
      res,
      {
        entity: LeaderboardWeeklyLevelView,
        order: { xp7d: 'DESC' },
        mapRow: (row) => ({
          userId: row.userId,
          username: row.username,
          xp7d: Number(row.xp7d),
        }),
        getUserId: (row) => row.userId,
      },
    );
  }

  return respondWithLeaderboard(
    req,
    res,
    {
      entity: LeaderboardLevelView,
      order: { level: 'DESC', xp: 'DESC' },
      mapRow: (row) => ({
        userId: row.userId,
        username: row.username,
        level: row.level,
        xp: row.xp,
      }),
      getUserId: (row) => row.userId,
    },
  );
}

export function getWeeklyWinningsLeaderboard(req: Request, res: Response) {
  const period = (req.query as unknown as LeaderboardQuery).period ?? 'alltime';
  if (period === 'alltime') {
    return respondWithLeaderboard(
      req,
      res,
      {
        entity: LeaderboardAlltimeWinningsView,
        order: { netWinnings: 'DESC' },
        mapRow: (row) => ({
          userId: row.userId,
          username: row.username,
          netWinnings: Number(row.netWinnings),
        }),
        getUserId: (row) => row.userId,
      },
    );
  }

  return respondWithLeaderboard(
    req,
    res,
    {
      entity: LeaderboardWeeklyWinningsView,
      order: { netWinnings7d: 'DESC' },
      mapRow: (row) => ({
        userId: row.userId,
        username: row.username,
        netWinnings7d: Number(row.netWinnings7d),
      }),
      getUserId: (row) => row.userId,
    },
  );
}
