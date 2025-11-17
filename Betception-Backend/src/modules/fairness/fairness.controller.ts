import { Request, Response } from 'express';
import { AppDataSource } from '../../db/data-source.js';
import { Round } from '../../entity/Round.js';
import { RoundStatus } from '../../entity/enums.js';
import { buildFairnessPayload } from './fairness.utils.js';
import type {
  FairnessHistoryQuery,
  FairnessRoundParams,
} from './fairness.schema.js';

export async function getRoundFairness(
  req: Request<FairnessRoundParams>,
  res: Response,
) {
  const repo = AppDataSource.getRepository(Round);
  const round = await repo.findOne({
    where: { id: req.params.roundId },
    select: [
      'id',
      'status',
      'createdAt',
      'startedAt',
      'endedAt',
      'serverSeedHash',
      'serverSeed',
    ],
  });

  if (!round) {
    return res.status(404).json({ message: 'Round not found' });
  }

  return res.json({ round: buildFairnessPayload(round) });
}

export async function listFairnessHistory(req: Request, res: Response) {
  const { limit, page } = req.query as unknown as FairnessHistoryQuery;
  const repo = AppDataSource.getRepository(Round);
  const [items, total] = await repo.findAndCount({
    where: { status: RoundStatus.SETTLED },
    order: { endedAt: 'DESC' },
    take: limit,
    skip: (page - 1) * limit,
    select: [
      'id',
      'status',
      'createdAt',
      'startedAt',
      'endedAt',
      'serverSeedHash',
      'serverSeed',
    ],
  });

  return res.json({
    page,
    pageSize: limit,
    total,
    items: items.map(buildFairnessPayload),
  });
}
