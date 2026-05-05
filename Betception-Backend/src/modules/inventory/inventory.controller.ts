import { Request, Response } from 'express';
import { MoreThan } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { PowerupType } from '../../entity/PowerupType.js';
import { User } from '../../entity/User.js';
import { UserPowerup } from '../../entity/UserPowerup.js';
import {
  isPowerPillCode,
  POWER_PILL_USES,
  POWER_PILL_WHERE,
  serializeActivePowerup,
  serializePowerupType,
} from '../powerups/power-pills.js';
import type { EquipPowerupInput } from './inventory.schema.js';

class InventoryError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'InventoryError';
  }
}

function handleInventoryError(res: Response, error: unknown) {
  if (error instanceof InventoryError) {
    return res.status(error.statusCode).json({ message: error.message, code: error.code });
  }
  throw error;
}

export async function listInventory(req: Request, res: Response) {
  const userId = String(req.user?.sub);
  const repo = AppDataSource.getRepository(UserPowerup);
  const powerups = await repo.find({
    where: { user: { id: userId }, type: POWER_PILL_WHERE, quantity: MoreThan(0) },
    relations: ['type'],
    order: { acquiredAt: 'DESC' },
  });
  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: userId },
    relations: ['activePowerupType'],
  });

  return res.json({
    items: powerups.map((entry) => ({
      id: entry.id,
      quantity: entry.quantity,
      acquiredAt: entry.acquiredAt,
      type: entry.type ? serializePowerupType(entry.type) : null,
    })),
    activePowerup: user ? serializeActivePowerup(user) : null,
  });
}

export async function equipPowerup(
  req: Request<unknown, unknown, EquipPowerupInput>,
  res: Response,
) {
  const userId = String(req.user?.sub);
  const { typeId } = req.body;

  try {
    const result = await AppDataSource.transaction(async (manager) => {
      const type = await manager.getRepository(PowerupType).findOne({ where: { id: typeId } });
      if (!type || !isPowerPillCode(type.code)) {
        throw new InventoryError(404, 'POWERUP_NOT_FOUND', 'Power pill not found');
      }

      const userRepo = manager.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: userId },
        relations: ['activePowerupType'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new InventoryError(404, 'USER_NOT_FOUND', 'User not found');
      if (user.activePowerupType && user.activePowerupUsesRemaining > 0) {
        throw new InventoryError(409, 'ACTIVE_POWERUP_SLOT_OCCUPIED', 'A power pill is already active');
      }

      const inventoryRepo = manager.getRepository(UserPowerup);
      const inventory = await inventoryRepo.findOne({
        where: { user: { id: userId }, type: { id: type.id } },
        relations: ['type'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!inventory || inventory.quantity < 1) {
        throw new InventoryError(404, 'POWERUP_NOT_OWNED', 'Power pill not found in inventory');
      }

      inventory.quantity -= 1;
      await inventoryRepo.save(inventory);

      user.activePowerupType = type;
      user.activePowerupUsesRemaining = POWER_PILL_USES;
      await userRepo.save(user);

      return {
        quantity: inventory.quantity,
        activePowerup: serializeActivePowerup(user),
      };
    });

    return res.status(201).json({
      message: 'Power pill equipped',
      quantity: result.quantity,
      activePowerup: result.activePowerup,
    });
  } catch (error) {
    return handleInventoryError(res, error);
  }
}
