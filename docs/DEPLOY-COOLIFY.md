# Deploy no Coolify

O Coolify já roda o próprio proxy (Traefik) na 80/443 e cuida de domínios + TLS.
Por isso **não usamos o nosso `caddy`** — use o compose específico
[`infra/docker-compose.coolify.yml`](../infra/docker-compose.coolify.yml).

## 1. Criar a aplicação

1. **+ New → Application → Git Based → Private Repository (with GitHub App)**
   (ou _Public Repository_ se o repo for público). O GitHub App dá **auto-deploy no push**.
2. Selecione o repositório `jorguzz-fer/vethis-plataform` e a branch `main`.
3. **Build Pack: Docker Compose**.
4. **Docker Compose Location:** `infra/docker-compose.coolify.yml`.
   (Base Directory `/` — a raiz do repo.)

## 2. Variáveis de ambiente

Na aba **Environment Variables**, cole (ajustando valores e domínios):

```
APP_URL=https://vethis.com.br
PUBLIC_API_URL=https://api.vethis.com.br
# Aluno (Vite) — build args: URL da API e do site (CTA "explorar cursos").
VITE_API_URL=https://api.vethis.com.br
VITE_SITE_URL=https://vethis.com.br
# Site (Next.js) — checkout no navegador. NEXT_PUBLIC_* é assado em `next build`.
NEXT_PUBLIC_API_URL=https://api.vethis.com.br
NEXT_PUBLIC_APP_URL=https://app.vethis.com.br
CORS_ORIGINS=https://vethis.com.br,https://app.vethis.com.br,https://admin.vethis.com.br

POSTGRES_USER=vethis
POSTGRES_PASSWORD=<senha forte>
POSTGRES_DB=vethis
DATABASE_URL=postgresql://vethis:<senha forte>@postgres:5432/vethis

REDIS_URL=redis://redis:6379

SESSION_SECRET=<openssl rand -hex 32>
COOKIE_DOMAIN=.vethis.com.br
```

Opcionais (checkout/hardening), quando tiver: `GOOGLE_*`, `ASAAS_*`, `VIMEO_ACCESS_TOKEN`, `SENTRY_DSN`.

> `PUBLIC_API_URL` (aluno/backoffice) e `NEXT_PUBLIC_*` (site) são **build args**
> assados no bundle. Marque-os como disponíveis em build time no Coolify (a UI tem
> essa opção por variável) e faça **rebuild** ao alterá-los.

## 3. Domínios por serviço

O compose expõe 4 serviços. No Coolify, atribua um domínio a cada um
(a UI lista os serviços do compose; defina o FQDN e a porta de destino):

| Serviço      | Domínio                              | Porta |
| ------------ | ------------------------------------ | ----- |
| `site`       | `vethis.com.br`, `www.vethis.com.br` | 3000  |
| `api`        | `api.vethis.com.br`                  | 3333  |
| `aluno`      | `app.vethis.com.br`                  | 80    |
| `backoffice` | `admin.vethis.com.br`                | 80    |

`postgres` e `redis` **não** recebem domínio (ficam internos).

DNS: aponte todos esses subdomínios (A record) para o IP do servidor do Coolify.

## 4. Deploy + migração

1. **Deploy**. O Coolify builda as imagens e sobe os serviços.
2. Rode a migração uma vez (Coolify → serviço `api` → **Execute Command** /
   terminal do container):
   ```bash
   node dist/db/migrate.js
   # opcional (dados demo):
   node dist/db/seed.js
   ```
3. Healthcheck: `https://api.vethis.com.br/v1/health` → `{"status":"ok","db":"up","redis":"up"}`.

## Notas

- Ao trocar `PUBLIC_API_URL`, é preciso **rebuild** do aluno/backoffice (valor assado no bundle).
- Mantenha `admin.vethis.com.br` restrito (IP allow-list/VPN) se possível.
- Backups: configure snapshot/backup do volume do `postgres` no Coolify.
- O `docker-compose.prod.yml` (com `caddy`) continua válido para VPS **sem** Coolify.
