import { z } from 'zod';

export const EquipPowerupSchema = z.object({
  typeId: z.coerce.number().int().positive(),
});

export type EquipPowerupInput = z.infer<typeof EquipPowerupSchema>;
