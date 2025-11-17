import { z } from 'zod';

export const ConsumePowerupSchema = z.object({
  typeId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
  roundId: z
    .string()
    .regex(/^\d+$/, { message: 'roundId must be a numeric string' })
    .optional(),
});

export type ConsumePowerupInput = z.infer<typeof ConsumePowerupSchema>;
