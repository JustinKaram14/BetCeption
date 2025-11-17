import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  getWalletSummary,
  getWalletTransactions,
  depositFunds,
  withdrawFunds,
} from './wallet.controller.js';
import {
  WalletAdjustmentSchema,
  WalletTransactionsQuerySchema,
} from './wallet.schema.js';

export const walletRouter = Router();

walletRouter.use(authGuard);
walletRouter.get('/', getWalletSummary);
walletRouter.get(
  '/transactions',
  validateRequest(WalletTransactionsQuerySchema, 'query'),
  getWalletTransactions,
);
walletRouter.post('/deposit', validateRequest(WalletAdjustmentSchema), depositFunds);
walletRouter.post('/withdraw', validateRequest(WalletAdjustmentSchema), withdrawFunds);

