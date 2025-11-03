import { z } from 'zod';
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(32)
});
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
