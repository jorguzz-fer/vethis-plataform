# ADR 0005 — Vídeo das aulas no Vimeo (embed privado)

- Status: aceito
- Data: 2026-07-12

## Contexto

A área do aluno precisa de player de aulas com proteção básica contra
compartilhamento não autorizado, sem operar infraestrutura de vídeo própria.

## Opções consideradas

1. **Vimeo embed privado** com restrição de domínio — simples de operar, sem código de infra.
2. Cloudflare Stream / Mux — mais controle programático e analytics, porém mais integração.
3. Panda Video — forte em anti-pirataria no BR, menos flexível via API.

## Decisão

Fase 1 usa **Vimeo com embed privado** e restrição de domínio. Cada aula guarda
`vimeo_video_id`; o front monta o embed. Reavaliar Cloudflare Stream/Mux se
precisarmos de proteção mais forte, analytics de retenção ou custo previsível em
escala (novo ADR).

## Consequências

Time to market rápido; proteção moderada. Portabilidade preservada por guardar
só o id do vídeo — trocar de provedor não afeta o schema de catálogo.
