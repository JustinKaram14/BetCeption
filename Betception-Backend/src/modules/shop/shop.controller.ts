import { Request, Response } from 'express';
import { AppDataSource } from '../../db/data-source.js';
import { PowerupType } from '../../entity/PowerupType.js';
import { User } from '../../entity/User.js';
import { WalletTransaction } from '../../entity/WalletTransaction.js';
import { WalletTransactionKind } from '../../entity/enums.js';
import { decimalToCents, centsToDecimal } from '../../utils/money.js';
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
  const powerups = await repo.find({ order: { minLevel: 'ASC', price: 'ASC' } });

  return res.json({
    items: powerups.map((type) => ({
      id: type.id,
      code: type.code,
      title: type.title,
      description: type.description,
      minLevel: type.minLevel,
      price: Number(type.price),
      effect: type.effectJson,
    })),
  });
}

export async function purchasePowerup(
  req: Request<unknown, unknown, PurchasePowerupInput>,
  res: Response,
) {
  const { typeId, quantity } = req.body;
  const typeRepo = AppDataSource.getRepository(PowerupType);
  const type = await typeRepo.findOne({ where: { id: typeId } });
  if (!type) return res.status(404).json({ message: 'Power-up not found' });

  const userId = String(req.user?.sub);
  const unitPriceCents = decimalToCents(type.price);
  const totalPriceCents = unitPriceCents * BigInt(quantity);

  try {
    const result = await AppDataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new ShopError(404, 'USER_NOT_FOUND', 'User not found');

      if (user.level < type.minLevel) {
        throw new ShopError(403, 'LEVEL_TOO_LOW', 'Power-up locked for your current level');
      }

      const balanceCents = decimalToCents(user.balance);
      if (balanceCents < totalPriceCents) {
        throw new ShopError(400, 'INSUFFICIENT_FUNDS', 'Insufficient balance');
      }

      user.balance = centsToDecimal(balanceCents - totalPriceCents);
      await userRepo.save(user);

      // Atomically insert or accumulate quantity — avoids findOne race conditions
      await manager.query(
        'INSERT INTO user_powerups (user_id, type_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)',
        [userId, type.id, quantity],
      );
      const rows = await manager.query<Array<{ quantity: number }>>(
        'SELECT quantity FROM user_powerups WHERE user_id = ? AND type_id = ?',
        [userId, type.id],
      );
      const inventoryQuantity = Number(rows?.[0]?.quantity ?? quantity);

      const walletRepo = manager.getRepository(WalletTransaction);
      const walletTx = walletRepo.create({
        user,
        kind: WalletTransactionKind.ADJUSTMENT,
        amount: centsToDecimal(-totalPriceCents),
        refTable: 'powerup_types',
        refId: String(type.id),
      });
      await walletRepo.save(walletTx);

      return {
        newBalance: user.balance,
        inventoryQuantity,
      };
    });

    return res.status(201).json({
      message: 'Power-up purchased',
      balance: Number(result.newBalance),
      quantity: result.inventoryQuantity,
    });
  } catch (error) {
    return handleShopError(res, error);
  }
}

