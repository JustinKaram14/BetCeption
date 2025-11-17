import { z } from 'zod';

export const FairnessRoundParamsSchema = z.object({
  roundId: z
    .string()
    .regex(/^\d+$/, { message: 'roundId must be a numeric identifier' }),
});

export const FairnessHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

export type FairnessRoundParams = z.infer<typeof FairnessRoundParamsSchema>;
export type FairnessHistoryQuery = z.infer<typeof FairnessHistoryQuerySchema>;
