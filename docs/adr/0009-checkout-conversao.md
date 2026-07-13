# ADR 0009 — Fluxo de checkout de baixa fricção (login-antes, página única)

- Status: aceito
- Data: 2026-07-13

## Contexto

O site precisa vender cursos. A meta é o **menor número de passos para maior
conversão**, no contexto de infoproduto brasileiro. A pesquisa (Asaas, Ensinio,
ThriveCart, SamCart) aponta: checkout de página única (sem redirect), Pix como
padrão, poucos campos, e order-bump (converte 30–40%) como alavancas principais.

Sobre exigir conta: a opção de maior conversão pura é _guest checkout_ com conta
criada pós-pagamento. O produto, porém, é acesso a curso (área do aluno), e o
comprador **É** o aluno — vincular a compra a uma conta antes do pagamento evita
matrícula órfã e simplifica o domínio (a sessão já existe). Decisão do dono do
produto: **exigir login/cadastro antes do pagamento**.

## Decisão

Fluxo em **duas etapas percebidas**, tudo numa página (`/checkout/[slug]`):

1. **Autenticação** — cadastro (nome, e-mail, senha) ou login, inline, sem sair
   da página. Cria a sessão (cookie httpOnly compartilhado em `.vethis.com.br`).
2. **Pagamento** — Pix (padrão), cartão parcelado (até 12x) ou boleto. Pix/boleto
   ficam `pending` e o front faz _polling_ do pedido; cartão autoriza na hora.

Domínio novo em `apps/api`: `orders` + `payments`, atrás do port
`PaymentGateway` (ADR 0004). Endpoints: `POST /v1/checkout`, `GET /v1/orders/:id`,
`POST /v1/webhooks/payments` e `POST /v1/orders/:id/simulate-payment` (só dev).
O pagamento confirmado (cartão síncrono, ou webhook para Pix/boleto) promove o
pedido a `paid`, cria a **matrícula** (idempotente) e registra a compra no CRM
(lead `won` + interação na timeline).

Adapter **`fake`** primeiro (autoriza cartão na hora; Pix/boleto pendentes com
código/URL fictícios), exercitando o fluxo ponta-a-ponta sem PSP. **Asaas
sandbox** entra pelo mesmo token de DI, sem tocar no serviço de checkout.

Order-bump fica **modelado como decisão** mas não implementado na fase 1 (só há
um produto por pedido; não existe produto complementar para ofertar ainda).

## Consequências

- Menos fricção que redirect para página de PSP; Pix-first favorece conversão.
- Matrícula sempre vinculada a uma conta (sem pós-associação frágil).
- Order-bench de conversão (guest checkout puro) fica disponível como evolução.
- Checkout testável sem rede via adapter `fake`; troca para Asaas isolada.
