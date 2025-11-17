import { z } from 'zod';

export const PurchasePowerupSchema = z.object({
  typeId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export type PurchasePowerupInput = z.infer<typeof PurchasePowerupSchema>;

