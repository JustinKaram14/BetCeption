import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { getWalletSummary, getWalletTransactions } from './wallet.controller.js';
import { WalletTransactionsQuerySchema } from './wallet.schema.js';

export const walletRouter = Router();

walletRouter.use(authGuard);
walletRouter.get('/', getWalletSummary);
walletRouter.get(
  '/transactions',
  validateRequest(WalletTransactionsQuerySchema, 'query'),
  getWalletTransactions,
);

