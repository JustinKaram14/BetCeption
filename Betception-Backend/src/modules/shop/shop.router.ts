import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { listPowerups, purchasePowerup } from './shop.controller.js';
import { PurchasePowerupSchema } from './shop.schema.js';

export const shopRouter = Router();

shopRouter.get('/powerups', listPowerups);
shopRouter.post(
  '/powerups/purchase',
  authGuard,
  validateRequest(PurchasePowerupSchema),
  purchasePowerup,
);

