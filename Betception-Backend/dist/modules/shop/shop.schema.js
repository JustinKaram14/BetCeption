import { z } from 'zod';
export const PurchasePowerupSchema = z.object({
    typeId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1).max(99).default(1),
});
