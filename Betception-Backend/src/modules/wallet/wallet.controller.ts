import { Request, Response } from 'express';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { User } from '../../entity/User.js';
import { WalletTransaction } from '../../entity/WalletTransaction.js';
import { WalletTransactionKind } from '../../entity/enums.js';
import { centsToDecimal, centsToNumber, decimalToCents } from '../../utils/money.js';
import { buildLevelProgress } from '../progression/progression.js';
import type {
  WalletAdjustmentInput,
  WalletTransactionsDateRangeQuery,
  WalletTransactionsQuery,
} from './wallet.schema.js';

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
    levelProgress: buildLevelProgress(user),
    lastDailyRewardAt: user.lastDailyRewardAt,
  });
}

export async function getWalletTransactions(req: Request, res: Response) {
  const userId = String(req.user?.sub);
  const { limit, page, from, to } = req.query as unknown as WalletTransactionsQuery;

  const repo = AppDataSource.getRepository(WalletTransaction);
  const [items, total] = await repo.findAndCount({
    where: buildWalletTransactionWhere(userId, { from, to }),
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

export async function getWalletTransactionsSummary(req: Request, res: Response) {
  const userId = String(req.user?.sub);
  const { from, to } = req.query as unknown as WalletTransactionsDateRangeQuery;
  const repo = AppDataSource.getRepository(WalletTransaction);
  const items = await repo.find({
    where: buildWalletTransactionWhere(userId, { from, to }),
    select: ['amount'],
  });

  let totalWinsCents = 0n;
  let totalLossesOrBetsCents = 0n;
  let netTotalCents = 0n;

  for (const tx of items) {
    const amountCents = decimalToCents(tx.amount);
    netTotalCents += amountCents;
    if (amountCents > 0n) {
      totalWinsCents += amountCents;
    } else if (amountCents < 0n) {
      totalLossesOrBetsCents += -amountCents;
    }
  }

  return res.json({
    totalWins: centsToNumber(totalWinsCents),
    totalLossesOrBets: centsToNumber(totalLossesOrBetsCents),
    netTotal: centsToNumber(netTotalCents),
    transactionCount: items.length,
  });
}

function buildWalletTransactionWhere(
  userId: string,
  range: WalletTransactionsDateRangeQuery,
): FindOptionsWhere<WalletTransaction> {
  const where: FindOptionsWhere<WalletTransaction> = { user: { id: userId } };

  if (range.from && range.to) {
    where.createdAt = Between(range.from, range.to);
  } else if (range.from) {
    where.createdAt = MoreThanOrEqual(range.from);
  } else if (range.to) {
    where.createdAt = LessThanOrEqual(range.to);
  }

  return where;
}

class WalletAdjustmentError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'WalletAdjustmentError';
  }
}

export async function depositFunds(
  req: Request<unknown, unknown, WalletAdjustmentInput>,
  res: Response,
) {
  try {
    const userId = String(req.user?.sub);
    const amountCents = decimalToCents(req.body.amount);
    const result = await performWalletAdjustment(
      userId,
      amountCents,
      WalletTransactionKind.DEPOSIT,
      req.body.reference,
    );
    return res.status(201).json({
      message: 'Deposit recorded',
      balance: result.balance,
      transactionId: result.transactionId,
    });
  } catch (error) {
    return handleWalletError(res, error);
  }
}

export async function withdrawFunds(
  req: Request<unknown, unknown, WalletAdjustmentInput>,
  res: Response,
) {
  try {
    const userId = String(req.user?.sub);
    const amountCents = decimalToCents(req.body.amount);
    const result = await performWalletAdjustment(
      userId,
      amountCents,
      WalletTransactionKind.WITHDRAW,
      req.body.reference,
    );
    return res.status(201).json({
      message: 'Withdrawal recorded',
      balance: result.balance,
      transactionId: result.transactionId,
    });
  } catch (error) {
    return handleWalletError(res, error);
  }
}

async function performWalletAdjustment(
  userId: string,
  amountCents: bigint,
  kind: WalletTransactionKind,
  reference?: string,
) {
  return AppDataSource.transaction(async (manager) => {
    const userRepo = manager.getRepository(User);
    const walletRepo = manager.getRepository(WalletTransaction);
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ['activePowerupType'],
      lock: { mode: 'pessimistic_write' },
    });
    if (!user) {
      throw new WalletAdjustmentError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const balanceCents = decimalToCents(user.balance);
    if (kind === WalletTransactionKind.WITHDRAW && balanceCents < amountCents) {
      throw new WalletAdjustmentError(400, 'INSUFFICIENT_FUNDS', 'Insufficient balance');
    }

    const newBalance =
      kind === WalletTransactionKind.WITHDRAW
        ? balanceCents - amountCents
        : balanceCents + amountCents;

    user.balance = centsToDecimal(newBalance);
    await userRepo.save(user);

    const signedAmount =
      kind === WalletTransactionKind.WITHDRAW ? -amountCents : amountCents;
    const tx = walletRepo.create({
      user,
      kind,
      amount: centsToDecimal(signedAmount),
      refTable: reference ?? 'wallet_manual',
      refId: null,
    });
    await walletRepo.save(tx);

    return {
      balance: centsToNumber(newBalance),
      transactionId: tx.id,
    };
  });
}

function handleWalletError(res: Response, error: unknown) {
  if (error instanceof WalletAdjustmentError) {
    return res
      .status(error.statusCode)
      .json({ message: error.message, code: error.code });
  }
  throw error;
}
