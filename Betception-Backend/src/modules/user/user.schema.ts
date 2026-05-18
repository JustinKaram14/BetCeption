import { z } from 'zod';
import { UsernameSchema } from '../../utils/username.js';

export const ProfileAvatarIconSchema = z.enum([
  'chip',
  'spade',
  'crown',
  'bolt',
  'diamond',
  'orbit',
  'cards',
  'flame',
  'star',
]);

export const ProfileAvatarColorSchema = z.enum([
  'cyan',
  'blue',
  'violet',
  'magenta',
  'red',
  'gold',
  'green',
  'ice',
  'white',
]);

export const UserIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

export const UpdateOwnProfileSchema = z
  .object({
    username: UsernameSchema.optional(),
    email: z.string().trim().email().optional(),
    avatarIcon: ProfileAvatarIconSchema.optional(),
    avatarColor: ProfileAvatarColorSchema.optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
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
