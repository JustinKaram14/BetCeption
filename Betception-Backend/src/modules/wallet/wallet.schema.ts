import { z } from 'zod';

const dateRangeParamSchema = z
  .string()
  .datetime({ offset: true, message: 'Invalid date' })
  .transform((value) => new Date(value));

const amountSchema = z.coerce
  .number()
  .positive()
  .max(1_000_000)
  .refine((value) => Number.isFinite(value), { message: 'Invalid number' })
  .refine((value) => Number(value.toFixed(2)) === value, {
    message: 'Amount must have at most two decimal places',
  });

const dateRangeQueryShape = {
  from: dateRangeParamSchema.optional(),
  to: dateRangeParamSchema.optional(),
};

const validDateRange = (value: { from?: Date; to?: Date }) =>
  !value.from || !value.to || value.from.getTime() <= value.to.getTime();

export const WalletTransactionsDateRangeQuerySchema = z
  .object(dateRangeQueryShape)
  .refine(validDateRange, { message: 'from must be before or equal to to', path: ['from'] });

export const WalletTransactionsQuerySchema = z
  .object({
    ...dateRangeQueryShape,
    limit: z.coerce.number().int().min(1).max(100).default(20),
    page: z.coerce.number().int().min(1).default(1),
  })
  .refine(validDateRange, { message: 'from must be before or equal to to', path: ['from'] });

export const WalletAdjustmentSchema = z.object({
  amount: amountSchema,
  reference: z
    .string()
    .trim()
    .min(1, 'Reference must not be empty')
    .max(32)
    .optional(),
});

export type WalletTransactionsQuery = z.infer<typeof WalletTransactionsQuerySchema>;
export type WalletTransactionsDateRangeQuery = z.infer<typeof WalletTransactionsDateRangeQuerySchema>;
export type WalletAdjustmentInput = z.infer<typeof WalletAdjustmentSchema>;
