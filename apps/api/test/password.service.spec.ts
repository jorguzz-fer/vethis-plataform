import { describe, expect, it } from 'vitest';
import { PasswordService } from '../src/auth/password.service';

describe('PasswordService (Argon2id)', () => {
  const svc = new PasswordService();

  it('gera hash verificável para a senha correta', async () => {
    const hash = await svc.hash('senha-super-secreta');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await svc.verify(hash, 'senha-super-secreta')).toBe(true);
  });

  it('rejeita senha incorreta', async () => {
    const hash = await svc.hash('senha-super-secreta');
    expect(await svc.verify(hash, 'senha-errada')).toBe(false);
  });

  it('retorna false (sem lançar) para hash inválido', async () => {
    expect(await svc.verify('nao-e-um-hash', 'qualquer')).toBe(false);
  });
});
