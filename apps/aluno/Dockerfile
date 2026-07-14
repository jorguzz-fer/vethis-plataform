# Área do Aluno (SPA estática servida por Caddy). Build da RAIZ do monorepo:
#   docker build -f apps/aluno/Dockerfile --build-arg VITE_API_URL=https://api.vethis.com.br -t vethis-aluno .

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /repo
# URL pública da API e do site são "assadas" no bundle em tempo de build.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_SITE_URL
ENV VITE_SITE_URL=$VITE_SITE_URL
# Baixa as dependências a partir do lockfile (camada cacheada por hash do
# lockfile — só refaz o download quando as deps mudam, não a cada mudança de
# código). Reduz tempo/memória do build e evita re-baixar 745 pacotes por deploy.
# package.json junto com o lockfile: o corepack lê o campo `packageManager`
# e usa a MESMA versão do pnpm no fetch e no install (senão o fetch, sem
# manifesto, baixaria o pnpm mais recente). O `pnpm fetch` ignora o manifesto
# para resolução — baixa só a partir do lockfile —, então o cache continua
# invalidando apenas quando o lockfile muda.
COPY pnpm-lock.yaml package.json ./
RUN pnpm fetch
COPY . .
RUN pnpm install --frozen-lockfile --prefer-offline
RUN pnpm --filter @vethis/aluno build

FROM caddy:2-alpine AS runner
COPY apps/aluno/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /repo/apps/aluno/dist /usr/share/caddy
EXPOSE 80
