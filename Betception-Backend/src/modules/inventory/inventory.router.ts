import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { equipPowerup, listInventory } from './inventory.controller.js';
import { EquipPowerupSchema } from './inventory.schema.js';

export const inventoryRouter = Router();

inventoryRouter.use(authGuard);
inventoryRouter.get('/powerups', listInventory);
inventoryRouter.post('/powerups/equip', validateRequest(EquipPowerupSchema), equipPowerup);

