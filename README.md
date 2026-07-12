# Vethis — Plataforma de Educação Médica Veterinária

Monorepo da plataforma **Vethis**: educação continuada em medicina veterinária.
Três ambientes sobre uma única API:

- **Site/Ecommerce** (`apps/site`) — catálogo e venda de cursos (Next.js, SEO).
- **Área do Aluno** (`apps/aluno`) — cursos, player, progresso e secretaria online (React+Vite PWA; base do app iOS/Android via Capacitor).
- **Backoffice** (`apps/backoffice`) — admin, CRM próprio e painel de KPIs (React+Vite).

> Guia rápido do projeto para humanos e agentes: [`CLAUDE.md`](./CLAUDE.md).
> Topologia e grafo de dependências: [`docs/architecture.md`](./docs/architecture.md).

## Stack

TypeScript end-to-end · NestJS (API + BFF) · PostgreSQL + Drizzle · Redis ·
Next.js + React/Vite · Tailwind + design system Vethis · pnpm workspaces ·
OpenAPI 3.1 → `api-client` gerado.

## Estrutura

```
apps/        api · site · aluno · backoffice
packages/    shared · api-client · design-tokens · ui
infra/       docker-compose (postgres, redis) · Caddyfile
docs/        adr/ · architecture.md · prototype/ (mockup) · brand/ (logos)
```

## Desenvolvimento

Pré-requisitos: **Node 22+**, **pnpm 10+**, **Docker**.

```bash
pnpm install

# infra local (Postgres + Redis)
docker compose -f infra/docker-compose.yml up -d

# variáveis de ambiente
cp .env.example .env   # preencha; NUNCA commite o .env

# desenvolvimento (apps em paralelo)
pnpm dev

# gates de qualidade (os mesmos do CI)
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm format            # aplica Prettier
```

## Segurança

Auth/authz server-side; segredos fora do repo (só `.env.example` com placeholders);
`gitleaks` no pre-commit e no CI; dinheiro em centavos; RBAC + MFA para papéis
sensíveis. Detalhes nos ADRs 0006–0007 e no `CLAUDE.md`.

## Decisões (ADRs)

Ver [`docs/adr/`](./docs/adr/):

| ADR  | Decisão                                                   |
| ---- | --------------------------------------------------------- |
| 0001 | Monorepo com pnpm workspaces                              |
| 0002 | Stack TypeScript end-to-end                               |
| 0003 | CRM próprio (não embutir Twenty)                          |
| 0004 | Pagamentos via port `PaymentGateway` (Asaas/Pagar.me)     |
| 0005 | Vídeo no Vimeo (embed privado)                            |
| 0006 | Auth própria, sessão server-side, RBAC e MFA              |
| 0007 | Convenções de modelagem de dados                          |
| 0008 | Infra (VPS + Docker Compose + Caddy) e mobile (Capacitor) |

## Roadmap (milestones)

- **M0** — scaffold do monorepo, tooling, infra, CI, ADRs, design tokens ✅
- **M1** — API base (NestJS + Drizzle + auth + OpenAPI)
- **M2** — design system (tokens + componentes base)
- **M3** — site/ecommerce
- **M4** — área do aluno (PWA)
- **M5** — backoffice (admin, CRM, KPIs)

> O mockup HTML aprovado está preservado em [`docs/prototype/`](./docs/prototype/)
> como referência visual. Conteúdo de demonstração (cursos, números) é fictício.
