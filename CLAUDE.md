# CLAUDE.md — Guia do repositório Vethis

> Mapa enxuto do projeto para agentes de IA e humanos. Leia isto antes de
> varrer arquivos. Cada app/pacote relevante tem seu próprio `CLAUDE.md`.

## O que é

Plataforma **Vethis** — educação médica veterinária continuada. Três ambientes:

1. **Site/Ecommerce** (`apps/site`) — público, SEO, vende cursos.
2. **Área do Aluno** (`apps/aluno`) — cursos, player, progresso, secretaria online. PWA (base do Capacitor para iOS/Android).
3. **Backoffice** (`apps/backoffice`) — admin, CRM próprio, painel de KPIs.

Todos consomem a mesma **API** (`apps/api`). Web primeiro; lojas depois via Capacitor.

## Stack

TypeScript end-to-end · NestJS (API+BFF) · PostgreSQL + Drizzle · Redis (sessão/filas) ·
React+Vite (aluno, backoffice) · Next.js (site) · Tailwind + design system Vethis ·
pnpm workspaces · OpenAPI 3.1 → api-client gerado.

## Estrutura

```
apps/
  api/         # NestJS — API única versionada + BFF (M1)
  site/        # Next.js — site/ecommerce (M3)
  aluno/       # React+Vite PWA — área do aluno (M4)
  backoffice/  # React+Vite — admin/CRM/KPIs (M5)
packages/
  shared/         # tipos, schemas Zod, utils (@vethis/shared)
  api-client/     # cliente tipado, gerado do OpenAPI (@vethis/api-client)
  design-tokens/  # tokens da marca Vethis (@vethis/design-tokens)
  ui/             # componentes base React do DS (@vethis/ui)
infra/           # docker-compose (postgres, redis), Caddyfile (ingress)
docs/
  adr/           # decisões arquiteturais (0001–0008)
  architecture.md# topologia e grafo de dependências
  prototype/     # mockup HTML aprovado (referência visual)
  brand/         # logos
```

Dependências: `apps/*` → `packages/api-client` + `packages/ui`; `ui` → `design-tokens`;
`api-client` → `shared`. Sem ciclos. Ver `docs/architecture.md`.

## Comandos

```bash
pnpm install                 # instala tudo (workspaces)
docker compose -f infra/docker-compose.yml up -d   # sobe Postgres + Redis
pnpm dev                     # sobe apps em paralelo
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # gates de CI
pnpm format                  # aplica Prettier
```

## Convenções e princípios (do Engineering Blueprint)

- **Server-authoritative**: auth, authz e regra de negócio vivem na API. Cliente é apresentação.
- **Segredos** nunca no repo — só `.env.example` com placeholders. gitleaks no pre-commit e no CI.
- **Dinheiro em centavos** (inteiro); `uuid`; `timestamptz`; soft-delete + auditoria em entidades sensíveis.
- **RBAC**: papéis `aluno` / `staff` / `admin`. MFA TOTP obrigatório para staff/admin.
- **Contrato como fonte de verdade**: OpenAPI 3.1 gera o `api-client`.
- **Conventional Commits**; PRs pequenos; decisão relevante vira ADR em `docs/adr/`.
- **Pagamentos** via port `PaymentGateway` (adapter `fake` em dev, `asaas` sandbox depois).
- **Vídeo**: Vimeo embed privado; a aula guarda `vimeo_video_id`.

## Estado atual

M0 (scaffold) concluído: monorepo, tooling, infra local, CI, ADRs, design tokens.
Próximo: **M1 — API base** (NestJS + Drizzle + auth + OpenAPI). Ver `docs/adr/` e o
plano de milestones no PR.
