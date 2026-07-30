#!/bin/sh
# Entrypoint da API em produção: aplica as migrations no start (idempotente) e
# sobe o servidor. Assim, todo deploy que sobe uma imagem nova já migra o banco
# antes de servir tráfego. Opcionalmente roda o seed quando SEED_ON_START=true.
set -e

echo "[entrypoint] Aplicando migrations…"
node dist/db/migrate.js

if [ "${SEED_ON_START}" = "true" ]; then
  echo "[entrypoint] SEED_ON_START=true → executando seed (idempotente)…"
  node dist/db/seed.js
fi

echo "[entrypoint] Iniciando a API…"
exec node dist/main.js
