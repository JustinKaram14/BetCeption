import { z } from 'zod';
const amountSchema = z.coerce
    .number()
    .positive()
    .max(1_000_000)
    .refine((value) => Number.isFinite(value), { message: 'Invalid number' })
    .refine((value) => Number(value.toFixed(2)) === value, {
    message: 'Amount must have at most two decimal places',
});
export const WalletTransactionsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    page: z.coerce.number().int().min(1).default(1),
});
export const WalletAdjustmentSchema = z.object({
    amount: amountSchema,
    reference: z
        .string()
        .trim()
        .min(1, 'Reference must not be empty')
        .max(32)
        .optional(),
});
