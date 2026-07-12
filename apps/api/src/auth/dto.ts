import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres').max(200),
  name: z.string().min(1).max(120).optional(),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});
export type LoginDto = z.infer<typeof loginSchema>;
