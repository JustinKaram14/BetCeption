import { Request, Response } from 'express';
import { AppDataSource } from '../../db/data-source.js';
import { User } from '../../entity/User.js';
import { WalletTransaction } from '../../entity/WalletTransaction.js';
import type { WalletTransactionsQuery } from './wallet.schema.js';

export async function getWalletSummary(req: Request, res: Response) {
  const userId = String(req.user?.sub);
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({
    where: { id: userId },
    select: ['id', 'username', 'balance', 'xp', 'level', 'lastDailyRewardAt'],
  });

  if (!user) return res.status(404).json({ message: 'User not found' });

  return res.json({
    id: user.id,
    username: user.username,
    balance: Number(user.balance),
    xp: user.xp,
    level: user.level,
    lastDailyRewardAt: user.lastDailyRewardAt,
  });
}

export async function getWalletTransactions(req: Request, res: Response) {
  const userId = String(req.user?.sub);
  const { limit, page } = req.query as unknown as WalletTransactionsQuery;

  const repo = AppDataSource.getRepository(WalletTransaction);
  const [items, total] = await repo.findAndCount({
    where: { user: { id: userId } },
    order: { createdAt: 'DESC' },
    take: limit,
    skip: (page - 1) * limit,
  });

  return res.json({
    page,
    pageSize: limit,
    total,
    items: items.map((tx) => ({
      id: tx.id,
      kind: tx.kind,
      amount: Number(tx.amount),
      refTable: tx.refTable,
      refId: tx.refId,
      createdAt: tx.createdAt,
    })),
  });
}
