# Deploy no Coolify

O Coolify já roda o próprio proxy (Traefik) na 80/443 e cuida de domínios + TLS.
Por isso **não usamos o nosso `caddy`** — use o compose específico
[`infra/docker-compose.coolify.yml`](../infra/docker-compose.coolify.yml).

## 1. Criar a aplicação

1. **+ New → Application → Git Based → Private Repository (with GitHub App)**
   (ou _Public Repository_ se o repo for público). O GitHub App dá **auto-deploy no push**.
2. Selecione o repositório `jorguzz-fer/vethis-plataform` e a branch `main`.
3. **Build Pack: Docker Compose**.
4. **Docker Compose Location:** `infra/docker-compose.coolify.yml`.
   (Base Directory `/` — a raiz do repo.)

## 2. Variáveis de ambiente

Na aba **Environment Variables**, cole (ajustando valores e domínios):

```
APP_URL=https://vethis.com.br
PUBLIC_API_URL=https://api.vethis.com.br
# Aluno (Vite) — build args: URL da API e do site (CTA "explorar cursos").
VITE_API_URL=https://api.vethis.com.br
VITE_SITE_URL=https://vethis.com.br
# Site (Next.js) — checkout no navegador. NEXT_PUBLIC_* é assado em `next build`.
NEXT_PUBLIC_API_URL=https://api.vethis.com.br
NEXT_PUBLIC_APP_URL=https://app.vethis.com.br
CORS_ORIGINS=https://vethis.com.br,https://app.vethis.com.br,https://admin.vethis.com.br

POSTGRES_USER=vethis
POSTGRES_PASSWORD=<senha forte>
POSTGRES_DB=vethis
DATABASE_URL=postgresql://vethis:<senha forte>@postgres:5432/vethis

REDIS_URL=redis://redis:6379

SESSION_SECRET=<openssl rand -hex 32>
COOKIE_DOMAIN=.vethis.com.br
```

Opcionais (checkout/hardening), quando tiver: `GOOGLE_*`, `ASAAS_*`, `VIMEO_ACCESS_TOKEN`, `SENTRY_DSN`.

> **Upload de imagens no admin (capas):** a API grava os arquivos enviados em
> `UPLOADS_DIR` e os serve em `/uploads`. Como o disco do container é efêmero,
> configure na **API-Vethis**:
>
> ```
> PUBLIC_API_URL=https://api.vethis.com.br   # URL pública da API (monta a URL do arquivo)
> UPLOADS_DIR=/data/uploads                  # pasta gravável (aponte um volume persistente)
> ```
>
> E adicione um **Persistent Storage** na API-Vethis montado em `/data/uploads`
> (Coolify → aba Storages). Sem o volume, as imagens somem no próximo deploy.

> **Publicar o catálogo (primeiro deploy):** defina `SEED_ON_START=true`. O
> entrypoint da API roda o seed idempotente (cria/atualiza o curso). As
> migrations rodam sempre; o seed só quando esta var é `true`. Depois do
> primeiro deploy você pode voltar para `false` (ou remover) — o seed é
> idempotente, então rodar de novo não duplica nada.

> `PUBLIC_API_URL` (aluno/backoffice) e `NEXT_PUBLIC_*` (site) são **build args**
> assados no bundle. Marque-os como disponíveis em build time no Coolify (a UI tem
> essa opção por variável) e faça **rebuild** ao alterá-los.

## 3. Domínios por serviço

O compose expõe 4 serviços. No Coolify, atribua um domínio a cada um
(a UI lista os serviços do compose; defina o FQDN e a porta de destino):

| Serviço      | Domínio                              | Porta |
| ------------ | ------------------------------------ | ----- |
| `site`       | `vethis.com.br`, `www.vethis.com.br` | 3000  |
| `api`        | `api.vethis.com.br`                  | 3333  |
| `aluno`      | `app.vethis.com.br`                  | 80    |
| `backoffice` | `admin.vethis.com.br`                | 80    |

`postgres` e `redis` **não** recebem domínio (ficam internos).

DNS: aponte todos esses subdomínios (A record) para o IP do servidor do Coolify.

## 4. Deploy + migração

1. **Deploy**. O Coolify builda as imagens e sobe os serviços.
2. Rode a migração uma vez (Coolify → serviço `api` → **Execute Command** /
   terminal do container):
   ```bash
   node dist/db/migrate.js
   # opcional (dados demo):
   node dist/db/seed.js
   ```
3. Healthcheck: `https://api.vethis.com.br/v1/health` → `{"status":"ok","db":"up","redis":"up"}`.

## Notas

- Ao trocar `PUBLIC_API_URL`, é preciso **rebuild** do aluno/backoffice (valor assado no bundle).
- Mantenha `admin.vethis.com.br` restrito (IP allow-list/VPN) se possível.
- Backups: configure snapshot/backup do volume do `postgres` no Coolify.
- O `docker-compose.prod.yml` (com `caddy`) continua válido para VPS **sem** Coolify.

## Asaas em produção (pagamentos reais)

Sandbox e produção diferem **só por variáveis de ambiente** na **API-Vethis** —
o código é o mesmo. Checklist:

1. No painel do Asaas **de produção** (`https://www.asaas.com`, não o sandbox):
   - **Integrações → Chave de API**: gere a chave de produção.
   - **Integrações → Webhooks → Novo**: URL `https://api.vethis.com.br/v1/webhooks/asaas`,
     versão **v3**, token de autenticação (invente um segredo longo e guarde),
     fila de sincronização **ativa**, e-mail de alerta preenchido. Eventos mínimos:
     `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` (os demais são ignorados pela API).
   - Cartão de crédito: confirme que a conta está **aprovada para cobranças no cartão**
     (o Asaas libera após análise; antes disso a API devolve o erro do provedor).
2. Na **API-Vethis** (Coolify → Environment Variables):
   ```
   PAYMENT_GATEWAY=asaas
   ASAAS_BASE_URL=https://api.asaas.com/v3
   ASAAS_API_KEY=<chave de PRODUÇÃO>
   ASAAS_WEBHOOK_TOKEN=<o mesmo token cadastrado no webhook>
   ```
   Sem `ASAAS_WEBHOOK_TOKEN` a API **não sobe** (de propósito: sem ele nenhum
   Pix/boleto confirmaria). Com `NODE_ENV=production` e URL de sandbox, a API sobe
   mas registra um `WARN` no log de boot.
3. Redeploy da API e conferir no log: `Gateway de pagamento: asaas (https://api.asaas.com/v3)`.
4. Teste real de ponta a ponta: um Pix de valor baixo (crie um curso de teste
   despublicado ou use um cupom/valor mínimo), confira que o pedido vai para
   `paid` e a matrícula aparece na área do aluno; depois estorne no painel.
5. Se o webhook falhar (token errado, API fora), o Asaas **pausa a fila** após
   várias tentativas: em **Integrações → Webhooks** reative a fila depois de corrigir.
6. **Rede de segurança:** a API reconcilia sozinha. A cada
   `PAYMENT_RECONCILE_INTERVAL_SEC` (padrão 300 s; primeira rodada 20 s após o
   boot) ela consulta no Asaas os pedidos pendentes dos últimos 30 dias e
   confirma os já pagos (matrícula + e-mails), mesmo que o webhook não tenha
   chegado. Para forçar agora: `POST /v1/admin/payments/reconcile` (staff/admin).

Endpoints relevantes: `POST /v1/webhooks/asaas` (produção, autenticado pelo header
`asaas-access-token`); `POST /v1/webhooks/payments` e `simulate-payment` só
funcionam com `PAYMENT_GATEWAY=fake` fora de produção.

## Stripe (cartão e Pix)

Com `PAYMENT_GATEWAY=stripe`, **cartão e Pix** passam pela Stripe e o **boleto
parcelado (carnê, até 15x)** continua no Asaas — a Stripe só emite boleto à
vista. Cada meio pode ser trocado isoladamente com `PAYMENT_GATEWAY_PIX`,
`PAYMENT_GATEWAY_CARD` e `PAYMENT_GATEWAY_BOLETO` (ex.: `PAYMENT_GATEWAY_PIX=asaas`
enquanto o Pix não for liberado na conta Stripe).

**Recurso API-Vethis:**

```
PAYMENT_GATEWAY=stripe
STRIPE_SECRET_KEY=sk_live_...     # Desenvolvedores → Chaves de API
STRIPE_WEBHOOK_SECRET=whsec_...   # do endpoint abaixo
# Manter as do Asaas: atendem o carnê e confirmam cobranças antigas.
ASAAS_API_KEY=...
ASAAS_WEBHOOK_TOKEN=...
```

**Recurso vethis-Site (build variable, rebuild ao alterar):**

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Webhook (painel Stripe → Desenvolvedores → Webhooks → Adicionar destino):**

- URL: `https://api.vethis.com.br/v1/webhooks/stripe`
- Eventos: `payment_intent.succeeded` e `payment_intent.payment_failed`
- Copie o "Segredo de assinatura" (`whsec_`) para `STRIPE_WEBHOOK_SECRET`.

Teste e produção são contas separadas: `pk_test_`/`sk_test_` usam o `whsec_` do
webhook criado no modo de teste; `pk_live_`/`sk_live_`, o do modo de produção.

**Como funciona:**

- **Cartão**: o número, a validade e o CVV ficam num campo seguro da Stripe
  (iframe); a API recebe só o token `pm_...`. Parcelado: a API pede à Stripe os
  planos aceitos por aquele cartão e só confirma se o nº de parcelas escolhido
  estiver entre eles (senão, mensagem "Este cartão aceita até Nx"). Se o banco
  exigir 3D Secure, o desafio abre no próprio checkout.
- **Pix**: QR + copia-e-cola válidos por 24h; confirma pelo webhook.
- **Reconciliação**: a mesma rotina consulta Stripe e Asaas, cada cobrança no
  provedor que a emitiu.

**Ordem segura para ligar:**

1. Cadastre as variáveis acima (API e site).
2. Faça o deploy de **API-Vethis** e **vethis-Site** (o site precisa de rebuild
   para assar a chave publicável).
3. Crie o webhook de produção na Stripe e faça uma compra real de valor baixo
   em cartão e em Pix.

> Se a API não subir, o log mostra exatamente qual variável falta (ex.:
> `STRIPE_WEBHOOK_SECRET é obrigatório: a Stripe atende pix, card`).

## E-mails transacionais (Brevo)

A API envia três e-mails ao aluno (bem-vindo ao criar a conta, pedido criado
com Pix/boleto, pagamento confirmado com link da área do aluno) e, opcionalmente,
um aviso interno por venda. Sem configurar, `MAIL_PROVIDER=log` apenas registra
no console — **nada é enviado** (a API avisa com `WARN` no boot em produção).

1. Em **https://app.brevo.com**: crie a conta e, em **Remetentes e domínios →
   Domínios**, adicione `vethis.com.br` e publique os registros DNS que a Brevo
   mostrar (DKIM/SPF, e opcionalmente DMARC). Sem isso o e-mail cai em spam ou é
   recusado. Depois cadastre o remetente (ex.: `nao-responda@vethis.com.br`).
2. Em **SMTP & API → Chaves de API**, gere uma chave.
3. Na **API-Vethis** (Coolify → Environment Variables):
   ```
   MAIL_PROVIDER=brevo
   BREVO_API_KEY=<chave>
   MAIL_FROM=nao-responda@vethis.com.br
   MAIL_FROM_NAME=Vethis
   MAIL_REPLY_TO=contato@vethis.com.br      # opcional: para onde vão as respostas
   SALES_NOTIFY_EMAIL=vendas@vethis.com.br  # opcional: aviso interno por venda
   ALUNO_URL=https://app.vethis.com.br
   ```
   Com `MAIL_PROVIDER=brevo` sem `BREVO_API_KEY`/`MAIL_FROM`, a API não sobe.
4. Redeploy e conferir no log: `E-mail: brevo (remetente nao-responda@vethis.com.br)`.
5. Teste: crie uma conta nova no checkout (bem-vindo) e faça um Pix de teste
   (pedido criado → pagamento confirmado + aviso interno).

Os envios são em segundo plano: uma falha na Brevo vira `WARN` no log e nunca
bloqueia o registro nem a confirmação da matrícula.
