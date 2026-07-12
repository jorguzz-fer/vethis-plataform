# ADR 0001 — Monorepo com pnpm workspaces

- Status: aceito
- Data: 2026-07-12

## Contexto

Precisamos de site, área do aluno, backoffice e API compartilhando tipos,
contrato de API e tokens de design, sem duplicar lógica por plataforma.

## Opções consideradas

1. **Monorepo (pnpm workspaces)** — compartilha `shared`/`api-client`/`design-tokens`/`ui`; build incremental; um só lugar de CI. Contras: tooling de workspace.
2. Multi-repo — isolamento forte, porém drift de tipos/contrato e overhead de versionamento entre repos.

## Decisão

Monorepo com **pnpm workspaces** (`apps/*`, `packages/*`). Turborepo/Nx só se o
build crescer. Imports por path alias `@vethis/*`; sem ciclos entre pacotes.

## Consequências

Reuso máximo de tipos e contrato; onboarding simples. Exige disciplina de
fronteiras entre pacotes (dependências apontando para dentro).
