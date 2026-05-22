import { Request, Response } from 'express';
import { AppDataSource } from '../../db/data-source.js';
import { PowerupType } from '../../entity/PowerupType.js';
import { User } from '../../entity/User.js';
import { WalletTransaction } from '../../entity/WalletTransaction.js';
import { WalletTransactionKind } from '../../entity/enums.js';
import { decimalToCents, centsToDecimal } from '../../utils/money.js';
import {
  calculatePowerPillPriceCents,
  isPowerPillCode,
  POWER_PILL_USES,
  POWER_PILL_WHERE,
  serializeActivePowerup,
  serializePowerupType,
} from '../powerups/power-pills.js';
import { applyAchievementProgress } from '../achievements/achievements.service.js';
import type { PurchasePowerupInput } from './shop.schema.js';

class ShopError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ShopError';
  }
}

function handleShopError(res: Response, error: unknown) {
  if (error instanceof ShopError) {
    return res.status(error.statusCode).json({ message: error.message, code: error.code });
  }
  throw error;
}

export async function listPowerups(_req: Request, res: Response) {
  const repo = AppDataSource.getRepository(PowerupType);
  const powerups = await repo.find({
    where: POWER_PILL_WHERE,
    order: { code: 'DESC' },
  });

  return res.json({
    items: powerups.map((powerup) => serializePowerupType(powerup)),
  });
}

export async function purchasePowerup(
  req: Request<unknown, unknown, PurchasePowerupInput>,
  res: Response,
) {
  const { typeId, quantity } = req.body;
  const userId = String(req.user?.sub);

  try {
    const result = await AppDataSource.transaction(async (manager) => {
      const type = await manager.getRepository(PowerupType).findOne({ where: { id: typeId } });
      if (!type || !isPowerPillCode(type.code)) {
        throw new ShopError(404, 'POWERUP_NOT_FOUND', 'Power-up not found');
      }

      const userRepo = manager.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: userId },
        relations: ['activePowerupType'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new ShopError(404, 'USER_NOT_FOUND', 'User not found');

      if (user.level < type.minLevel) {
        throw new ShopError(403, 'LEVEL_TOO_LOW', 'Power-up locked for your current level');
      }

      if (user.activePowerupType && user.activePowerupUsesRemaining > 0) {
        throw new ShopError(409, 'ACTIVE_POWERUP_SLOT_OCCUPIED', 'A power pill is already active');
      }

      const unitPriceCents = calculatePowerPillPriceCents(type, user);
      const totalPriceCents = unitPriceCents * BigInt(quantity);
      const balanceCents = decimalToCents(user.balance);
      if (balanceCents < totalPriceCents) {
        throw new ShopError(400, 'INSUFFICIENT_FUNDS', 'Insufficient balance');
      }

      user.balance = centsToDecimal(balanceCents - totalPriceCents);
      user.activePowerupType = type;
      user.activePowerupUsesRemaining = POWER_PILL_USES;
      await userRepo.save(user);

      const walletRepo = manager.getRepository(WalletTransaction);
      const walletTx = walletRepo.create({
        user,
        kind: WalletTransactionKind.ADJUSTMENT,
        amount: centsToDecimal(-totalPriceCents),
        refTable: 'powerup_types',
        refId: String(type.id),
      });
      await walletRepo.save(walletTx);

      const unlockedAchievements = await applyAchievementProgress(manager, user, [
        { code: 'PILL_TRIGGER_1', progress: 1 },
      ]);
      await userRepo.save(user);

      return {
        newBalance: user.balance,
        activePowerup: serializeActivePowerup(user),
        unlockedAchievements,
      };
    });

    return res.status(201).json({
      message: 'Power-up purchased',
      balance: Number(result.newBalance),
      quantity: 0,
      activePowerup: result.activePowerup,
      unlockedAchievements: result.unlockedAchievements,
    });
  } catch (error) {
    return handleShopError(res, error);
  }
}
