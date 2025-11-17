import crypto from 'crypto';
import { Request, Response } from 'express';
import { AppDataSource } from '../../db/data-source.js';
import { User } from '../../entity/User.js';
import { DailyRewardClaim } from '../../entity/DailyRewardClaim.js';
import { WalletTransaction } from '../../entity/WalletTransaction.js';
import { WalletTransactionKind } from '../../entity/enums.js';
import { dailyRewardConfig } from '../../config/rewards.js';
import { centsToDecimal, decimalToCents } from '../../utils/money.js';

function rollRewardAmount() {
  const { minAmount, maxAmount } = dailyRewardConfig;
  if (minAmount === maxAmount) return minAmount;
  const span = maxAmount - minAmount + 1;
  return minAmount + crypto.randomInt(span);
}

function nextEligibleFrom(date: Date) {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
  return next.toISOString();
}

export async function claimDailyReward(req: Request, res: Response) {
  const userId = String(req.user?.sub);
  const todayUtc = new Date().toISOString().slice(0, 10);

  try {
    const result = await AppDataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new Error('USER_NOT_FOUND');
      if (user.lastDailyRewardAt === todayUtc) throw new Error('NOT_ELIGIBLE');

      const amount = rollRewardAmount();
      const amountCents = decimalToCents(amount);
      const balanceCents = decimalToCents(user.balance);
      user.balance = centsToDecimal(balanceCents + amountCents);
      user.lastDailyRewardAt = todayUtc;
      await userRepo.save(user);

      const claimRepo = manager.getRepository(DailyRewardClaim);
      const claim = claimRepo.create({
        user,
        claimDate: todayUtc,
        amount: centsToDecimal(amountCents),
      });
      await claimRepo.save(claim);

      const walletRepo = manager.getRepository(WalletTransaction);
      const walletTx = walletRepo.create({
        user,
        kind: WalletTransactionKind.REWARD,
        amount: centsToDecimal(amountCents),
        refTable: 'daily_reward_claims',
        refId: claim.id,
      });
      await walletRepo.save(walletTx);

      return {
        claimedAmount: amount,
        balance: user.balance,
      };
    });

    return res.json({
      claimedAmount: result.claimedAmount,
      balance: Number(result.balance),
      eligibleAt: nextEligibleFrom(new Date()),
    });
  } catch (err: any) {
    const code = err?.message;
    if (code === 'NOT_ELIGIBLE') {
      return res.status(409).json({
        message: 'Reward already claimed for today',
        eligibleAt: nextEligibleFrom(new Date()),
      });
    }
    if (code === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'User not found' });
    }
    throw err;
  }
}

