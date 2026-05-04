import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { powerupRateLimiter } from '../../middlewares/rateLimiters.js';
import { consumePowerup } from './powerups.controller.js';
import { ConsumePowerupSchema } from './powerups.schema.js';

export const powerupsRouter = Router();

powerupsRouter.use(authGuard);
powerupsRouter.post('/consume', powerupRateLimiter, validateRequest(ConsumePowerupSchema), consumePowerup);
