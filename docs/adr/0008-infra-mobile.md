# ADR 0008 — Infra (VPS + Docker Compose + Caddy) e mobile (Capacitor)

- Status: aceito
- Data: 2026-07-12

## Contexto

Precisamos de deploy de baixo custo e controle total, e de um caminho para as
lojas iOS/Android sem construir um segundo front nativo agora.

## Opções consideradas

Infra: **VPS + Docker Compose** vs PaaS gerenciado (Railway/Render/Fly) vs Kubernetes.
Mobile: **Capacitor** (empacota o web app) vs React Native (Expo) vs só PWA.

## Decisão

**Infra**: VPS + **Docker Compose**; **Caddy** como ingress único (443, TLS
automático); Postgres/Redis/workers **sem portas públicas**; ambientes
dev→staging→prod pela mesma config parametrizada; segredos em cofre. Kubernetes
só quando escala/SRE justificar.

**Mobile**: quando formos às lojas, empacotar a **Área do Aluno** (PWA React+Vite)
com **Capacitor** (plugins nativos: push etc.). Um só código-base; sem app RN
separado. Reavaliar RN nativo se precisarmos de UX nativa intensa (offline
avançado, gestos) — novo ADR.

## Consequências

Custo baixo, paridade dev/prod e chegada rápida às lojas. UX mobile é a do web
app; aceito para a fase 1. Compose local (`infra/docker-compose.yml`) já funciona
para desenvolvimento.
