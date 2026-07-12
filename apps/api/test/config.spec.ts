import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/configuration';

const validEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://vethis:vethis@localhost:5432/vethis',
  SESSION_SECRET: 'a-very-long-session-secret',
} as NodeJS.ProcessEnv;

describe('loadConfig', () => {
  it('parseia e aplica defaults com env válido', () => {
    const cfg = loadConfig(validEnv);
    expect(cfg.API_PORT).toBe(3333);
    expect(cfg.NODE_ENV).toBe('test');
    expect(cfg.REDIS_URL).toBe('redis://localhost:6379');
  });

  it('falha quando falta um segredo obrigatório', () => {
    const { SESSION_SECRET: _omit, ...withoutSecret } = validEnv;
    void _omit;
    expect(() => loadConfig(withoutSecret as NodeJS.ProcessEnv)).toThrow(/SESSION_SECRET/);
  });

  it('falha quando a URL do banco é inválida', () => {
    expect(() => loadConfig({ ...validEnv, DATABASE_URL: 'nao-e-url' })).toThrow(
      /Configuração inválida/,
    );
  });
});
