import { describe, expect, it } from 'vitest';
import { changePasswordSchema, updateProfileSchema } from '../src/me/dto';

describe('updateProfileSchema', () => {
  it('exige nome com ao menos 2 caracteres', () => {
    expect(updateProfileSchema.safeParse({ name: 'Ana' }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ name: 'A' }).success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('exige senha nova com ao menos 8 caracteres', () => {
    expect(
      changePasswordSchema.safeParse({ currentPassword: 'antiga123', newPassword: 'novasenha1' })
        .success,
    ).toBe(true);
    expect(
      changePasswordSchema.safeParse({ currentPassword: 'x', newPassword: 'curta' }).success,
    ).toBe(false);
  });
});
