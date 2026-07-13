# Imagem da API Vethis (multi-stage, não-root).
# Build a partir da RAIZ do monorepo:
#   docker build -f apps/api/Dockerfile -t vethis-api .

# ---------- builder ----------
FROM node:22-alpine AS builder
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile

RUN pnpm --filter @vethis/api build

# ---------- runner ----------
# Preserva o layout do monorepo para a resolução de módulos (node_modules do
# pacote + da raiz, links do pnpm) ser idêntica à do build.
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=builder /repo ./
WORKDIR /repo/apps/api
USER node
EXPOSE 3333
# Migrations: `node dist/db/migrate.js` (o cwd aqui é /repo/apps/api).
CMD ["node", "dist/main.js"]
