#!/bin/sh
# Entrypoint da API em produção: aplica as migrations no start (idempotente) e
# sobe o servidor. Assim, todo deploy que sobe uma imagem nova já migra o banco
# antes de servir tráfego. Opcionalmente roda o seed quando SEED_ON_START=true.
#
# Roda como root APENAS para garantir a permissão do diretório de uploads (o
# volume montado pelo Coolify costuma vir como root) e então baixa o privilégio
# para o usuário `node` — o processo da API nunca roda como root.
set -e

# Garante que o diretório de uploads exista e seja gravável pelo usuário `node`.
UPLOADS_DIR="${UPLOADS_DIR:-./uploads}"
mkdir -p "$UPLOADS_DIR" 2>/dev/null || true
chown -R node:node "$UPLOADS_DIR" 2>/dev/null ||
  echo "[entrypoint] Aviso: não foi possível ajustar a permissão de $UPLOADS_DIR."

echo "[entrypoint] Aplicando migrations…"
su-exec node node dist/db/migrate.js

if [ "${SEED_ON_START}" = "true" ]; then
  echo "[entrypoint] SEED_ON_START=true → executando seed (idempotente)…"
  su-exec node node dist/db/seed.js
fi

echo "[entrypoint] Iniciando a API…"
exec su-exec node node dist/main.js
