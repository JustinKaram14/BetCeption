import { z } from 'zod';

export const LeaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  period: z.enum(['alltime', 'seven_days']).default('alltime'),
});

export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;

