import { z } from 'zod';
export const UserIdParamsSchema = z.object({
    id: z.string().regex(/^\d+$/),
});
