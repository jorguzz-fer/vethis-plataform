# ADR 0006 — Autenticação própria, sessão server-side, RBAC e MFA

- Status: aceito
- Data: 2026-07-12

## Contexto

Auth é fronteira de confiança e precisa ser server-authoritative. Queremos
controle total, sem custo por usuário e com dados no Brasil (LGPD).

## Opções consideradas

1. **Auth própria no backend** — e-mail+senha (Argon2id), Google OIDC, sessão em cookie httpOnly (store Redis), RBAC, MFA TOTP para papéis sensíveis.
2. Provedor gerenciado (Clerk/Auth0) — mais rápido, porém custo por MAU e dados fora.
3. Keycloak self-hosted — OIDC completo, mais um serviço para operar/customizar.

## Decisão

**Auth própria** na API. Senha com **Argon2id**; **Google OIDC** para login
social; sessão web em **cookie httpOnly + Secure + SameSite** com store no Redis
(revogação imediata em logout/troca de senha). **RBAC** com papéis
`aluno`/`staff`/`admin` (menor privilégio). **MFA TOTP obrigatório** para
`staff`/`admin`. Mobile/M2M via OAuth2/OIDC com refresh rotativo (quando entrar).

## Consequências

Sem dependência externa de identidade nem custo por usuário; dados no BR.
Responsabilidade de implementar reset seguro (sem enumeração), rate limiting e
lockout — previstos no M1.
