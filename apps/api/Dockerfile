# Imagem da API Vethis (multi-stage, não-root).
# Build a partir da RAIZ do monorepo:
#   docker build -f apps/api/Dockerfile -t vethis-api .

# ---------- builder ----------
FROM node:22-alpine AS builder
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

# Baixa as dependências a partir do lockfile (camada cacheada por hash do
# lockfile — só refaz o download quando as deps mudam, não a cada mudança de
# código). Reduz tempo/memória do build e evita re-baixar pacotes por deploy.
# package.json junto com o lockfile: o corepack lê o campo `packageManager`
# e usa a MESMA versão do pnpm no fetch e no install (senão o fetch, sem
# manifesto, baixaria o pnpm mais recente). O `pnpm fetch` ignora o manifesto
# para resolução — baixa só a partir do lockfile.
COPY pnpm-lock.yaml package.json ./
RUN pnpm fetch
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile --prefer-offline

RUN pnpm --filter @vethis/api build

# ---------- runner ----------
# Preserva o layout do monorepo para a resolução de módulos (node_modules do
# pacote + da raiz, links do pnpm) ser idêntica à do build.
FROM node:22-alpine AS runner
ENV NODE_ENV=production
# su-exec: baixa o privilégio de root para `node` no entrypoint (após ajustar a
# permissão do volume de uploads).
RUN apk add --no-cache su-exec
WORKDIR /repo
COPY --from=builder /repo ./
WORKDIR /repo/apps/api
# Diretório padrão do volume de uploads; a permissão final é ajustada em runtime
# pelo entrypoint (o volume montado pode vir como root).
RUN mkdir -p /data/uploads
EXPOSE 3333
# O entrypoint roda como root só para garantir a permissão do diretório de
# uploads e então baixa o privilégio para `node`: aplica as migrations
# (dist/db/migrate.js, cwd /repo/apps/api) e sobe a API. Com SEED_ON_START=true
# também roda o seed (idempotente).
CMD ["sh", "docker-entrypoint.sh"]
