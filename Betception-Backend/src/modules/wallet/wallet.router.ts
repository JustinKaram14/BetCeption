import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  getWalletSummary,
  getWalletTransactions,
  getWalletTransactionsSummary,
  depositFunds,
  withdrawFunds,
} from './wallet.controller.js';
import {
  WalletAdjustmentSchema,
  WalletTransactionsDateRangeQuerySchema,
  WalletTransactionsQuerySchema,
} from './wallet.schema.js';

export const walletRouter = Router();

walletRouter.use(authGuard);
walletRouter.get('/', getWalletSummary);
walletRouter.get(
  '/transactions/summary',
  validateRequest(WalletTransactionsDateRangeQuerySchema, 'query'),
  getWalletTransactionsSummary,
);
walletRouter.get(
  '/transactions',
  validateRequest(WalletTransactionsQuerySchema, 'query'),
  getWalletTransactions,
);
walletRouter.post('/deposit', validateRequest(WalletAdjustmentSchema), depositFunds);
walletRouter.post('/withdraw', validateRequest(WalletAdjustmentSchema), withdrawFunds);
