import crypto from 'crypto';
import { Request, Response } from 'express';
import { AppDataSource } from '../../db/data-source.js';
import { UserCrate } from '../../entity/UserCrate.js';
import { UserPowerup } from '../../entity/UserPowerup.js';
import { PowerupType } from '../../entity/PowerupType.js';
import { User } from '../../entity/User.js';
import { WalletTransaction } from '../../entity/WalletTransaction.js';
import { WalletTransactionKind } from '../../entity/enums.js';
import { centsToDecimal, decimalToCents } from '../../utils/money.js';
import { pickRandomPowerPillCode } from '../powerups/power-pills.js';

type CrateIdParams = { crateId: string };

function getUserId(req: Request): string {
  const sub = req.user?.sub;
  if (!sub) throw new CrateError(401, 'UNAUTHENTICATED', 'Authentication required');
  return String(sub);
}

const TIER_CONFIG: Array<{
  label: string;
  minCoins: number;
  maxCoins: number;
  pillChance: number;
}> = [
  { label: 'Common',    minCoins: 50,   maxCoins: 400,   pillChance: 0.04 },
  { label: 'Rare',      minCoins: 200,  maxCoins: 1000,  pillChance: 0.06 },
  { label: 'Epic',      minCoins: 500,  maxCoins: 3000,  pillChance: 0.08 },
];

export function getTierForLevel(level: number): number {
  if (level <= 5)  return 1;
  if (level <= 10) return 2;
  return 3;
}

function normalizeCrateTier(tier: number): number {
  const numericTier = Number.isFinite(tier) ? Math.floor(tier) : 1;
  return Math.min(3, Math.max(1, numericTier));
}

export function getPowerupRewardQuantityForTier(tier: number): number {
  return normalizeCrateTier(tier);
}

function rollReward(tier: number): { kind: 'coins'; amount: number } | { kind: 'powerup' } {
  const normalizedTier = normalizeCrateTier(tier);
  const cfg = TIER_CONFIG[normalizedTier - 1] ?? TIER_CONFIG[0];
  const rand = crypto.randomInt(10000) / 10000;
  if (rand < cfg.pillChance) {
    return { kind: 'powerup' };
  }
  const span = cfg.maxCoins - cfg.minCoins + 1;
  const amount = cfg.minCoins + crypto.randomInt(span);
  return { kind: 'coins', amount };
}

class CrateError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'CrateError';
  }
}

function serializeCrate(crate: UserCrate) {
  const tier = normalizeCrateTier(crate.tier);
  const label = TIER_CONFIG[tier - 1]?.label ?? 'Common';
  return {
    id: crate.id,
    tier,
    tierLabel: label,
    acquiredLevel: crate.acquiredLevel,
    acquiredAt: crate.acquiredAt,
    opened: crate.opened,
    openedAt: crate.openedAt ?? null,
    reward: crate.opened
      ? {
          kind: crate.rewardKind,
          coins: crate.rewardCoins !== null ? Number(crate.rewardCoins) : null,
          powerup: crate.rewardPowerupType
            ? {
                id: crate.rewardPowerupType.id,
                code: crate.rewardPowerupType.code,
                title: crate.rewardPowerupType.title,
                quantity: getPowerupRewardQuantityForTier(crate.tier),
              }
            : null,
        }
      : null,
  };
}

export async function listCrates(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const repo = AppDataSource.getRepository(UserCrate);
    const crates = await repo.find({
      where: { user: { id: userId } },
      relations: { rewardPowerupType: true },
      order: { acquiredAt: 'DESC' },
    });
    return res.json({ items: crates.map(serializeCrate) });
  } catch (error) {
    if (error instanceof CrateError) {
      return res.status(error.statusCode).json({ message: error.message, code: error.code });
    }
    throw error;
  }
}

export async function openCrate(req: Request<CrateIdParams>, res: Response) {
  try {
    const userId = getUserId(req);
    const { crateId } = req.params;

    const result = await AppDataSource.transaction(async (manager) => {
      const crateRepo = manager.getRepository(UserCrate);
      const crate = await crateRepo.findOne({
        where: { id: crateId, user: { id: userId } },
        relations: { user: true, rewardPowerupType: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!crate) throw new CrateError(404, 'CRATE_NOT_FOUND', 'Crate not found');
      if (crate.opened) throw new CrateError(409, 'ALREADY_OPENED', 'Crate already opened');

      const reward = rollReward(crate.tier);
      crate.opened = true;
      crate.openedAt = new Date();
      crate.rewardKind = reward.kind;

      const userRepo = manager.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: userId },
        relations: ['activePowerupType'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new CrateError(404, 'USER_NOT_FOUND', 'User not found');

      const walletRepo = manager.getRepository(WalletTransaction);

      if (reward.kind === 'coins') {
        const amountCents = decimalToCents(reward.amount);
        crate.rewardCoins = centsToDecimal(amountCents);
        user.balance = centsToDecimal(decimalToCents(user.balance) + amountCents);
        await userRepo.save(user);
        await walletRepo.save(
          walletRepo.create({
            user,
            kind: WalletTransactionKind.CRATE_REWARD,
            amount: centsToDecimal(amountCents),
            refTable: 'user_crates',
            refId: crate.id,
          }),
        );
      } else {
        const powerupCode = pickRandomPowerPillCode();
        const powerupRepo = manager.getRepository(PowerupType);
        const candidate = await powerupRepo.findOne({ where: { code: powerupCode } });

        if (candidate) {
          const quantity = getPowerupRewardQuantityForTier(crate.tier);
          crate.rewardPowerupType = candidate;
          const upRepo = manager.getRepository(UserPowerup);
          const existing = await upRepo.findOne({ where: { user: { id: userId }, type: { id: candidate.id } } });
          if (existing) {
            existing.quantity = (existing.quantity ?? 0) + quantity;
            await upRepo.save(existing);
          } else {
            await upRepo.save(upRepo.create({ user, type: candidate, quantity }));
          }
        } else {
          // Fallback to coins if no powerup found
          const amountCents = decimalToCents(50);
          crate.rewardKind = 'coins';
          crate.rewardCoins = centsToDecimal(amountCents);
          user.balance = centsToDecimal(decimalToCents(user.balance) + amountCents);
          await userRepo.save(user);
          await walletRepo.save(
            walletRepo.create({
              user,
              kind: WalletTransactionKind.CRATE_REWARD,
              amount: centsToDecimal(amountCents),
              refTable: 'user_crates',
              refId: crate.id,
            }),
          );
        }
      }

      await crateRepo.save(crate);
      return { crate, balance: user.balance };
    });

    return res.json({
      crate: serializeCrate(result.crate),
      balance: Number(result.balance),
    });
  } catch (error) {
    if (error instanceof CrateError) {
      return res.status(error.statusCode).json({ message: error.message, code: error.code });
    }
    throw error;
  }
}
