import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { listInventory } from './inventory.controller.js';
export const inventoryRouter = Router();
inventoryRouter.use(authGuard);
inventoryRouter.get('/powerups', listInventory);
