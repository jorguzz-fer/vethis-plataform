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

## Autenticação (M1b)

- Registro/login com senha **Argon2id** (`@node-rs/argon2`); login com auto-sessão.
- **Sessão server-side no Redis** — cookie httpOnly assinado com id opaco; revogação
  imediata. `SessionGuard` resolve o usuário a cada request (papel sempre fresco).
- **RBAC**: `@Roles('staff','admin')` + `RolesGuard` (usar após `SessionGuard`).
- Validação de payload por Zod (`ZodValidationPipe`); rate limiting global + por rota
  de auth (`@nestjs/throttler`). Login com mensagem uniforme (sem enumeração).
- Rotas: `POST /v1/auth/register|login|logout`, `GET /v1/auth/me`.

## Roadmap do M1

- **M1a** ✅ bootstrap + persistência (identity + audit) + health.
- **M1b** ✅ auth core: registro/login (Argon2id), sessão Redis, RBAC, rate limit.
- **M1c** ✅ domínio de catálogo (cursos/módulos/aulas) + OpenAPI 3.1 (`/v1/openapi.json`).
- **M1d** geração do `@vethis/api-client` a partir do contrato; domínios orders/enrollment.
- **Hardening (dívida)** MFA TOTP + Google OIDC + reset de senha — adiado (ver ADR 0006).

### Contrato OpenAPI

`buildOpenApiDocument()` monta o doc 3.1 a partir dos MESMOS schemas Zod da validação
(sem drift). `pnpm --filter @vethis/api openapi:generate` escreve `apps/api/openapi.json`
(commitado; fonte da geração do api-client). Servido em `GET /v1/openapi.json`.
