# Imagem da API Vethis (multi-stage, não-root).
# Build a partir da RAIZ do monorepo:
#   docker build -f apps/api/Dockerfile -t vethis-api .

# ---------- builder ----------
FROM node:22-alpine AS builder
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

# Instala com base no lockfile (cache de deps).
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile

RUN pnpm --filter @vethis/api build

# ---------- runner ----------
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/apps/api/drizzle ./drizzle
COPY --from=builder /repo/apps/api/package.json ./package.json

USER node
EXPOSE 3333
CMD ["node", "dist/main.js"]
