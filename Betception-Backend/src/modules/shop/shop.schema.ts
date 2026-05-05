import { z } from 'zod';

export const PurchasePowerupSchema = z.object({
  typeId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().refine((value) => value === 1, {
    message: 'Power pills can only be purchased one at a time',
  }).default(1),
});

export type PurchasePowerupInput = z.infer<typeof PurchasePowerupSchema>;

