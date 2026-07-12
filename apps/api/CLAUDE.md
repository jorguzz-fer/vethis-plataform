# apps/api — API Vethis (NestJS)

API única versionada + BFF. Server-authoritative: auth, authz e regra de negócio
vivem aqui; os clientes são apresentação.

## Stack

NestJS 10 (CommonJS) · Drizzle ORM + postgres.js · Zod (validação de config) ·
helmet + cookie-parser. Rotas sob **`/v1`** (versionamento por URI).

## Layout

```
src/
  config/     # env validada por Zod (token APP_CONFIG); ConfigModule global
  db/         # client Drizzle, DbModule (token DB), schema/, migrate.ts, seed.ts
    schema/   # fonte de verdade do banco: enums, identity, audit (+ domínios no M1)
  health/     # GET /v1/health (processo + ping ao banco)
  app.module.ts
  main.ts     # bootstrap: helmet, cookies, versioning, CORS, shutdown hooks
drizzle/      # migrations geradas (versionadas)
```

## Comandos

```bash
pnpm --filter @vethis/api dev          # tsx watch (requer .env + Postgres no ar)
pnpm --filter @vethis/api build        # tsc → dist
pnpm --filter @vethis/api test         # vitest
pnpm --filter @vethis/api db:generate  # gera migration a partir do schema
pnpm --filter @vethis/api db:migrate   # aplica migrations
pnpm --filter @vethis/api db:seed      # seed de dev (idempotente)
```

## Convenções

- **Injeção por token** (`@Inject(APP_CONFIG)`, `@Inject(DB)`) — evita depender de
  metadata de decorator; funciona em tsx (dev) e tsc (build).
- **Schema**: `uuid` PK, `timestamptz`, dinheiro em centavos, soft-delete +
  auditoria em entidades sensíveis (ADR 0007). Migrations versionadas, nunca
  alteração manual em prod.
- Segredos só via ambiente/cofre; `loadConfig()` falha rápido se algo faltar.

## Roadmap do M1

- **M1a** ✅ bootstrap + persistência (identity + audit) + health.
- **M1b** auth: registro/login (Argon2id), sessão no Redis, RBAC, MFA TOTP, Google OIDC.
- **M1c** OpenAPI 3.1 + geração do `@vethis/api-client`; domínios catalog/orders/…
