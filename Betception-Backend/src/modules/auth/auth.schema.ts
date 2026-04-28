import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  username: z.string().min(3).max(32),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
