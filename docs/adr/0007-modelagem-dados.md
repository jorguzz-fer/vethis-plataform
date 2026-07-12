# ADR 0007 — Convenções de modelagem de dados

- Status: aceito
- Data: 2026-07-12

## Contexto

Definir convenções de schema antes do M1 evita migrações dolorosas e garante
integridade e auditabilidade desde o início.

## Opções consideradas

1. **Convenções explícitas** (abaixo) desde o schema inicial.
2. Deixar caso a caso — gera inconsistência e retrabalho.

## Decisão

- Chaves **`uuid`**; timestamps **`timestamptz`**; dinheiro em **centavos** (inteiro), nunca float.
- **FKs, constraints e índices** pensados; `jsonb` só para campos genuinamente flexíveis.
- **Soft-delete + trilha de auditoria** (quem/o quê/quando) em entidades sensíveis.
- **Migrations versionadas** (Drizzle), idempotentes e revisadas no PR; nada de alteração manual em prod.
- **B2B modelado desde já**: tabelas `organizations` + `memberships` (user × org × papel), sem UI na fase 1 — clínica compra assentos para a equipe (painel entra na fase 2). Evita migração grande depois.

## Consequências

Base consistente e auditável; caminho de B2B aberto sem custo de UI agora.
Multitenancy por `tenant_id`/RLS **não** entra na fase 1 (B2C + orgs simples);
reavaliar se o produto virar SaaS multi-organização isolado (novo ADR).
