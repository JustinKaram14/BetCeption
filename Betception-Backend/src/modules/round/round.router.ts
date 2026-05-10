import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  startRound,
  hitRound,
  standRound,
  dealerStepRound,
  getActiveRound,
  getRound,
  settleRound,
  peekCard,
  swapCard,
  undoHit,
} from './round.controller.js';
import {
  RoundIdParamsSchema,
  StartRoundSchema,
  SwapCardBodySchema,
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
roundRouter.post(
  '/dealer-step/:roundId',
  validateRequest(RoundIdParamsSchema, 'params'),
  dealerStepRound,
);
roundRouter.get('/active', getActiveRound);
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
roundRouter.get(
  '/peek/:roundId',
  validateRequest(RoundIdParamsSchema, 'params'),
  peekCard,
);
roundRouter.post(
  '/swap-card/:roundId',
  validateRequest(RoundIdParamsSchema, 'params'),
  validateRequest(SwapCardBodySchema),
  swapCard,
);
roundRouter.post(
  '/undo/:roundId',
  validateRequest(RoundIdParamsSchema, 'params'),
  undoHit,
);
