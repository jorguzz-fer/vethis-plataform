import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '../src/auth/dto';

describe('registerSchema', () => {
  it('aceita payload válido', () => {
    const r = registerSchema.safeParse({ email: 'a@b.com', password: '12345678', name: 'Ana' });
    expect(r.success).toBe(true);
  });

  it('rejeita senha curta', () => {
    const r = registerSchema.safeParse({ email: 'a@b.com', password: '123' });
    expect(r.success).toBe(false);
  });

  it('rejeita e-mail inválido', () => {
    const r = registerSchema.safeParse({ email: 'nao-email', password: '12345678' });
    expect(r.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('exige e-mail e senha', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'a@b.com' }).success).toBe(false);
  });
});
