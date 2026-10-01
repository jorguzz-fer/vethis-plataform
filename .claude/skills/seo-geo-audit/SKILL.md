---
name: seo-geo-audit
description: >-
  Audita e melhora o SEO e o GEO (otimização para buscadores generativos/IA) do
  site Vethis (apps/site, Next.js App Router). Use quando pedirem para "rodar SEO",
  revisar SEO/GEO, melhorar ranqueamento, metadata, sitemap, robots, Open Graph,
  dados estruturados (JSON-LD / schema.org), llms.txt, ou compartilhamento em
  redes. Cobre auditoria, correção e verificação.
---

# SEO & GEO — site Vethis (`apps/site`)

O site é Next.js (App Router, `export const dynamic = 'force-dynamic'`). O SEO usa
a Metadata API do Next; o GEO usa dados estruturados + `llms.txt`. O helper central
é `apps/site/lib/seo.ts` e o bloco de dados estruturados é
`apps/site/components/site/json-ld.tsx` (`<JsonLd data={...} />`).

## 1. Auditar (o que checar)

Rode e confira:

```bash
# Arquivos de infra de SEO/GEO existem?
ls apps/site/app/sitemap.ts apps/site/app/robots.ts apps/site/app/llms.txt/route.ts
# Metadata por página (cada rota pública deve ter title/description próprios)
grep -rn "generateMetadata\|export const metadata" apps/site/app
# Dados estruturados
grep -rln "JsonLd\|application/ld+json" apps/site
# metadataBase + template de título + OG padrão
grep -n "metadataBase\|template\|openGraph\|twitter\|robots\|icons" apps/site/app/layout.tsx
```

Checklist (cada item deve estar OK):

- **metadataBase** e **title template** (`'%s · Vethis'`) no `app/layout.tsx`, com
  `openGraph`/`twitter`/`robots`/`icons` padrão.
- **`sitemap.ts`** lista home, `/cursos` e cada `/cursos/[slug]` (do catálogo).
- **`robots.ts`** permite `/`, bloqueia `/checkout/`, aponta o sitemap.
- **`llms.txt`** (`app/llms.txt/route.ts`) resume o site e lista os cursos (GEO).
- **Toda rota pública** tem `title`/`description` próprios e **canonical**
  (`alternates.canonical`). A home define canonical `/`; o layout NÃO define
  canonical (senão vaza para todas as páginas).
- **Dados estruturados** por página:
  - Home: `Organization` + `WebSite`.
  - Curso (`/cursos/[slug]`): `Course` + `BreadcrumbList` + `FAQPage`.
  - Catálogo (`/cursos`): `ItemList`.
- **Open Graph** com imagem: curso usa `coverUrl`; fallback `DEFAULT_OG_IMAGE`.
- Conteúdo: `<h1>` único por página, FAQ real nos dados do curso (bom para IA).

## 2. Corrigir / estender

- **Nova página pública** → adicione `export const metadata` (estático) ou
  `generateMetadata` (dinâmico) com `title`, `description` (use `metaDescription()`),
  `alternates.canonical` e `openGraph`. Veja `app/cursos/[slug]/page.tsx` como modelo.
- **Novo tipo de conteúdo** → acrescente um construtor em `lib/seo.ts`
  (`organizationLd`, `courseLd`, `breadcrumbLd`, `faqPageLd`, `courseListLd`) e
  renderize com `<JsonLd data={...} />` no topo do retorno da página.
- **Domínio**: `SITE_URL` vem de `NEXT_PUBLIC_SITE_URL` (fallback
  `https://vethis.com.br`). Garanta essa env em produção para URLs absolutas
  corretas (sitemap, OG, canonical).
- Mantenha descriptions ≤ ~160 caracteres e sem quebras (use `metaDescription`).
- O catálogo é a fonte de verdade: sitemap, `llms.txt` e `ItemList` leem de
  `getCourses()`, então novos cursos entram automaticamente.

## 3. Verificar antes de entregar

```bash
pnpm --filter @vethis/site typecheck
pnpm --filter @vethis/site build   # deve listar /sitemap.xml, /robots.txt, /llms.txt
pnpm lint && pnpm format:check
```

Validação manual pós-deploy (opcional): testar `/{sitemap.xml,robots.txt,llms.txt}`,
e os JSON-LD no Rich Results Test do Google e no Schema Markup Validator.

## Deploy

Mudanças são só de front-end → redeploy do **vethis-Site**. Sem migration/re-seed.
Confirme a env `NEXT_PUBLIC_SITE_URL` em produção.
