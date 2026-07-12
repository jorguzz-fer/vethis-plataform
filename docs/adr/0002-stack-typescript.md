# ADR 0002 — Stack TypeScript end-to-end

- Status: aceito
- Data: 2026-07-12

## Contexto

Um só ecossistema de tipos do backend ao front reduz drift e simplifica
contratação. Precisamos de API robusta, front web com SEO (ecommerce) e SPAs.

## Opções consideradas

1. **TS end-to-end**: NestJS (API+BFF), Next.js (site/SEO), React+Vite (aluno, backoffice), PostgreSQL + Drizzle, Redis.
2. Backend em Go/Elixir — melhor para alta performance/realtime, mas quebra o reuso de tipos e aumenta a superfície de contratação.

## Decisão

TypeScript em tudo. **NestJS** (DI, guards/interceptors, modular) para a API única
versionada + BFF. **Drizzle** (schema em TS, SQL previsível) sobre **PostgreSQL**.
**Redis** para sessão e filas. **Next.js** no site (SSR/SEO), **React+Vite** nas
áreas autenticadas. Contrato **OpenAPI 3.1** gera o `api-client`.

## Consequências

Máximo reuso; DX consistente. Node no core: para gargalos futuros de CPU,
extrair serviço específico (Go) só quando a escala justificar.
