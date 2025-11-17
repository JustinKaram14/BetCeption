import { Request, Response } from 'express';
import { AppDataSource } from '../../db/data-source.js';
import { UserPowerup } from '../../entity/UserPowerup.js';
import { PowerupConsumption } from '../../entity/PowerupConsumption.js';
import { Round } from '../../entity/Round.js';
import { HandOwnerType, RoundStatus } from '../../entity/enums.js';
import type { ConsumePowerupInput } from './powerups.schema.js';

class PowerupConsumptionError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'PowerupConsumptionError';
  }
}

export async function consumePowerup(
  req: Request<unknown, unknown, ConsumePowerupInput>,
  res: Response,
) {
  try {
    const userId = String(req.user?.sub);
    const { typeId, quantity, roundId } = req.body;

    const result = await AppDataSource.transaction(async (manager) => {
      const userPowerupRepo = manager.getRepository(UserPowerup);
      const consumptionRepo = manager.getRepository(PowerupConsumption);

      const userPowerup = await userPowerupRepo.findOne({
        where: { user: { id: userId }, type: { id: typeId } },
        relations: ['user', 'type'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!userPowerup) {
        throw new PowerupConsumptionError(404, 'POWERUP_NOT_OWNED', 'Power-up not found in inventory');
      }
      if (userPowerup.quantity < quantity) {
        throw new PowerupConsumptionError(400, 'INSUFFICIENT_STOCK', 'Not enough power-ups available');
      }

      let round: Round | null = null;
      if (roundId) {
        const roundRepo = manager.getRepository(Round);
        round = await roundRepo.findOne({
          where: { id: roundId },
          relations: { hands: { user: true } },
        });
        if (!round) {
          throw new PowerupConsumptionError(404, 'ROUND_NOT_FOUND', 'Round not found');
        }
        const ownsRound = (round.hands ?? []).some(
          (hand) => hand.ownerType === HandOwnerType.PLAYER && hand.user?.id === userId,
        );
        if (!ownsRound) {
          throw new PowerupConsumptionError(403, 'ROUND_NOT_OWNED', 'Round does not belong to the user');
        }
        if (round.status === RoundStatus.SETTLED || round.status === RoundStatus.ABORTED) {
          throw new PowerupConsumptionError(409, 'ROUND_INACTIVE', 'Cannot attach power-ups to inactive rounds');
        }
      }

      userPowerup.quantity -= quantity;
      await userPowerupRepo.save(userPowerup);

      const entries = Array.from({ length: quantity }, () =>
        consumptionRepo.create({
          user: userPowerup.user,
          type: userPowerup.type,
          round,
        }),
      );
      await consumptionRepo.save(entries);

      return {
        consumed: entries.length,
        remaining: userPowerup.quantity,
        powerup: {
          id: userPowerup.type.id,
          code: userPowerup.type.code,
          title: userPowerup.type.title,
          effect: userPowerup.type.effectJson,
        },
        roundId: round?.id ?? null,
      };
    });

    return res.status(201).json({
      message: 'Power-up activated',
      ...result,
    });
  } catch (error) {
    return handlePowerupError(res, error);
  }
}

function handlePowerupError(res: Response, error: unknown) {
  if (error instanceof PowerupConsumptionError) {
    return res
      .status(error.statusCode)
      .json({ message: error.message, code: error.code });
  }
  throw error;
}
