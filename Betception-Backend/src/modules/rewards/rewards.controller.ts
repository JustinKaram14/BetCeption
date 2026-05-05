import { Request, Response } from 'express';
import { AppDataSource } from '../../db/data-source.js';
import { User } from '../../entity/User.js';
import { DailyRewardClaim } from '../../entity/DailyRewardClaim.js';
import { WalletTransaction } from '../../entity/WalletTransaction.js';
import { UserPowerup } from '../../entity/UserPowerup.js';
import { PowerupType } from '../../entity/PowerupType.js';
import { WalletTransactionKind } from '../../entity/enums.js';
import { DAILY_STREAK_REWARDS } from '../../config/rewards.js';
import { centsToDecimal, decimalToCents } from '../../utils/money.js';

function nextEligibleFrom(date: Date): string {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
  return next.toISOString();
}

class RewardError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'RewardError';
  }
}

function handleRewardError(res: Response, error: unknown) {
  if (error instanceof RewardError) {
    return res.status(error.statusCode).json({ message: error.message, code: error.code });
  }
  throw error;
}

export async function getDailyRewardStatus(req: Request, res: Response) {
  const userId = String(req.user?.sub);
  const todayUtc = new Date().toISOString().slice(0, 10);

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' });

  let loginStreak = user.loginStreak ?? 0;
  const streakReset = user.streakExpiresAt !== null && todayUtc > user.streakExpiresAt;
  if (streakReset) loginStreak = 0;

  const currentDay = (loginStreak % 30) + 1;
  const isEligible = user.lastDailyRewardAt !== todayUtc;

  return res.json({
    loginStreak,
    currentDay,
    lastClaimedAt: user.lastDailyRewardAt ?? null,
    eligibleAt: isEligible ? null : nextEligibleFrom(new Date()),
    isEligible,
    schedule: DAILY_STREAK_REWARDS,
    streakReset,
  });
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
      if (!user) throw new RewardError(404, 'USER_NOT_FOUND', 'User not found');
      if (user.lastDailyRewardAt === todayUtc) {
        throw new RewardError(409, 'NOT_ELIGIBLE', 'Reward already claimed for today');
      }

      let streakReset = false;
      if (user.streakExpiresAt !== null && todayUtc > user.streakExpiresAt) {
        user.loginStreak = 0;
        streakReset = true;
      }

      const currentStreak = user.loginStreak ?? 0;
      const clampedDay = (currentStreak % 30) + 1;
      const reward = DAILY_STREAK_REWARDS[clampedDay - 1];

      let claimedCoins = 0;
      let claimAmountDecimal = '0.00';

      if (reward.kind === 'coins') {
        const coinCents = decimalToCents(reward.coins!);
        claimAmountDecimal = centsToDecimal(coinCents);
        claimedCoins = reward.coins!;
        user.balance = centsToDecimal(decimalToCents(user.balance) + coinCents);
      } else if (reward.kind === 'powerup' && reward.powerupCode) {
        const powerupTypeRepo = manager.getRepository(PowerupType);
        const powerupType = await powerupTypeRepo.findOne({ where: { code: reward.powerupCode } });
        if (powerupType) {
          const userPowerupRepo = manager.getRepository(UserPowerup);
          const existing = await userPowerupRepo.findOne({
            where: { user: { id: userId }, type: { id: powerupType.id } },
          });
          if (existing) {
            existing.quantity += 1;
            await userPowerupRepo.save(existing);
          } else {
            await userPowerupRepo.save(
              userPowerupRepo.create({ user, type: powerupType, quantity: 1 }),
            );
          }
        }
      }

      user.loginStreak = currentStreak + 1;
      user.lastDailyRewardAt = todayUtc;
      const expiry = new Date();
      expiry.setUTCDate(expiry.getUTCDate() + 2);
      user.streakExpiresAt = expiry.toISOString().slice(0, 10);
      await userRepo.save(user);

      const claimRepo = manager.getRepository(DailyRewardClaim);
      const claim = claimRepo.create({
        user,
        claimDate: todayUtc,
        streakDay: clampedDay,
        amount: claimAmountDecimal,
      });
      await claimRepo.save(claim);

      if (reward.kind === 'coins') {
        const walletRepo = manager.getRepository(WalletTransaction);
        await walletRepo.save(walletRepo.create({
          user,
          kind: WalletTransactionKind.REWARD,
          amount: claimAmountDecimal,
          refTable: 'daily_reward_claims',
          refId: claim.id,
        }));
      }

      return {
        claimedDay: clampedDay,
        reward,
        claimedAmount: claimedCoins,
        balance: user.balance,
        loginStreak: user.loginStreak,
        streakReset,
      };
    });

    return res.json({
      claimedDay: result.claimedDay,
      reward: result.reward,
      claimedAmount: result.claimedAmount,
      balance: Number(result.balance),
      eligibleAt: nextEligibleFrom(new Date()),
      loginStreak: result.loginStreak,
      streakReset: result.streakReset,
    });
  } catch (err: unknown) {
    if (err instanceof RewardError && err.code === 'NOT_ELIGIBLE') {
      return res.status(409).json({
        message: err.message,
        eligibleAt: nextEligibleFrom(new Date()),
      });
    }
    return handleRewardError(res, err);
  }
}

