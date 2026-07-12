# ADR 0003 — CRM próprio no backoffice (não embutir Twenty)

- Status: aceito
- Data: 2026-07-12

## Contexto

Avaliamos incorporar o CRM open source Twenty (twentyhq/twenty) dentro do admin.
Queremos CRM (leads, funil, timeline do aluno) integrado ao ecommerce e à área
do aluno, com login e visual únicos.

## Opções consideradas

1. **Módulo CRM próprio** no backoffice — mesmo banco, mesma auth, mesmo design system; enxuto e focado (leads, funil, timeline, carrinho abandonado).
2. Twenty ao lado via API — CRM completo no dia 1, mas login separado, overhead operacional e sincronização.
3. Embutir/forkar o Twenty no admin — licença **AGPL**, duas auths, upgrades dolorosos. Descartado.

## Decisão

Construir um **CRM próprio** como módulo do backoffice. A timeline é alimentada
por **eventos de domínio** (compra, matrícula, conclusão). A arquitetura de
eventos deixa a porta aberta para, no futuro, sincronizar com um Twenty externo
via API caso a necessidade de CRM cresça — sem acoplar agora.

## Consequências

Menos superfície e sem risco de licença AGPL. Funcionalidade de CRM começa
mínima e cresce conforme a demanda de vendas/marketing.
