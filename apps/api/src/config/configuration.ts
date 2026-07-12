import { z } from 'zod';

/**
 * Contrato de configuração da API (12-factor). Toda variável é validada no
 * boot — a aplicação falha rápido se algo obrigatório estiver ausente/ inválido.
 * Segredos vêm do ambiente/cofre, nunca do repositório.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3333),
  APP_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET deve ter ao menos 16 caracteres'),
  COOKIE_DOMAIN: z.string().default('localhost'),

  // Origens permitidas no CORS (separadas por vírgula). Em produção, liste os
  // domínios do site, área do aluno e backoffice. Default: APP_URL.
  CORS_ORIGINS: z.string().optional(),
});

export type AppConfig = Readonly<z.infer<typeof EnvSchema>>;

/** Token de injeção da configuração (evita ConfigService-por-tipo). */
export const APP_CONFIG = 'APP_CONFIG';

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuração inválida:\n${issues}`);
  }
  return Object.freeze(parsed.data);
}
