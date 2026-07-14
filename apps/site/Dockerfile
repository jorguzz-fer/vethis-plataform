# Site Vethis (Next.js standalone). Build a partir da RAIZ do monorepo:
#   docker build -f apps/site/Dockerfile -t vethis-site .

FROM node:22-alpine AS builder
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo
# Baixa as dependências a partir do lockfile (camada cacheada por hash do
# lockfile — só refaz o download quando as deps mudam, não a cada mudança de
# código). Reduz tempo/memória do build e evita re-baixar 745 pacotes por deploy.
COPY pnpm-lock.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --frozen-lockfile --prefer-offline
RUN pnpm --filter @vethis/site build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Escutar em todas as interfaces (senão o proxy do Coolify/Traefik não alcança).
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app
COPY --from=builder /repo/apps/site/.next/standalone ./
COPY --from=builder /repo/apps/site/.next/static ./apps/site/.next/static
# `output: standalone` NÃO inclui a pasta public/ — copiar à mão (senão as
# imagens em /public, como o logo, dão 404).
COPY --from=builder /repo/apps/site/public ./apps/site/public
USER node
EXPOSE 3000
CMD ["node", "apps/site/server.js"]
