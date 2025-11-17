import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  startRound,
  hitRound,
  standRound,
  getRound,
  settleRound,
} from './round.controller.js';
import {
  RoundIdParamsSchema,
  StartRoundSchema,
} from './round.schema.js';

export const roundRouter = Router();

roundRouter.use(authGuard);

roundRouter.post('/start', validateRequest(StartRoundSchema), startRound);
roundRouter.post(
  '/hit/:roundId',
  validateRequest(RoundIdParamsSchema, 'params'),
  hitRound,
);
roundRouter.post(
  '/stand/:roundId',
  validateRequest(RoundIdParamsSchema, 'params'),
  standRound,
);
roundRouter.get(
  '/:roundId',
  validateRequest(RoundIdParamsSchema, 'params'),
  getRound,
);
roundRouter.post(
  '/settle/:roundId',
  validateRequest(RoundIdParamsSchema, 'params'),
  settleRound,
);
