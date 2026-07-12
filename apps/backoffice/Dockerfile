# Backoffice (SPA estática servida por Caddy). Build da RAIZ do monorepo:
#   docker build -f apps/backoffice/Dockerfile --build-arg VITE_API_URL=https://api.vethis.com.br -t vethis-backoffice .

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /repo
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @vethis/backoffice build

FROM caddy:2-alpine AS runner
COPY apps/backoffice/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /repo/apps/backoffice/dist /usr/share/caddy
EXPOSE 80
