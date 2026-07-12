# Área do Aluno (SPA estática servida por Caddy). Build da RAIZ do monorepo:
#   docker build -f apps/aluno/Dockerfile --build-arg VITE_API_URL=https://api.vethis.com.br -t vethis-aluno .

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /repo
# URL pública da API é "assada" no bundle em tempo de build.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @vethis/aluno build

FROM caddy:2-alpine AS runner
COPY apps/aluno/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /repo/apps/aluno/dist /usr/share/caddy
EXPOSE 80
