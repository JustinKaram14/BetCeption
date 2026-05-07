import { z } from 'zod';

export const UserIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

export const UpdateOwnProfileSchema = z
  .object({
    username: z.string().trim().min(3).max(32).optional(),
    email: z.string().trim().email().optional(),
  })
  .refine((value) => value.username !== undefined || value.email !== undefined, {
    message: 'At least one field must be provided',
  });

export const ChangeOwnPasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type UserIdParams = z.infer<typeof UserIdParamsSchema>;
export type UpdateOwnProfileInput = z.infer<typeof UpdateOwnProfileSchema>;
export type ChangeOwnPasswordInput = z.infer<typeof ChangeOwnPasswordSchema>;
