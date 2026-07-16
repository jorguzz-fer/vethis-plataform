import { z } from 'zod';

/**
 * Contrato de configuração da API (12-factor). Toda variável é validada no
 * boot — a aplicação falha rápido se algo obrigatório estiver ausente/ inválido.
 * Segredos vêm do ambiente/cofre, nunca do repositório.
 */
const EnvSchema = z
  .object({
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

    // IA (opcional). Sem a chave, os recursos de IA ficam desativados (o backoffice
    // esconde o botão "Gerar com IA"). A chave vem só do ambiente/cofre.
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    AI_MODEL: z.string().min(1).default('claude-opus-4-8'),

    // Pagamentos (port PaymentGateway, ADR 0004). `fake` em dev; `asaas` quando as
    // credenciais estiverem no ambiente. Base URL: sandbox por padrão.
    PAYMENT_GATEWAY: z.enum(['fake', 'asaas']).default('fake'),
    ASAAS_API_KEY: z.string().min(1).optional(),
    ASAAS_BASE_URL: z.string().url().default('https://api-sandbox.asaas.com/v3'),
    ASAAS_WEBHOOK_TOKEN: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.PAYMENT_GATEWAY === 'asaas' && !env.ASAAS_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ASAAS_API_KEY'],
        message: 'ASAAS_API_KEY é obrigatória quando PAYMENT_GATEWAY=asaas',
      });
    }
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
