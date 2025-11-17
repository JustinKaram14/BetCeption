import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  getRoundFairness,
  listFairnessHistory,
} from './fairness.controller.js';
import {
  FairnessHistoryQuerySchema,
  FairnessRoundParamsSchema,
} from './fairness.schema.js';

export const fairnessRouter = Router();

fairnessRouter.get(
  '/rounds/:roundId',
  validateRequest(FairnessRoundParamsSchema, 'params'),
  getRoundFairness,
);

fairnessRouter.get(
  '/rounds/history',
  validateRequest(FairnessHistoryQuerySchema, 'query'),
  listFairnessHistory,
);
