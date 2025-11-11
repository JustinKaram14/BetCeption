import { z } from 'zod';

export const WalletTransactionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

export type WalletTransactionsQuery = z.infer<typeof WalletTransactionsQuerySchema>;

