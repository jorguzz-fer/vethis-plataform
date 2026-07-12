# ADR 0004 — Pagamentos via port PaymentGateway (Asaas/Pagar.me)

- Status: aceito
- Data: 2026-07-12

## Contexto

Mercado brasileiro exige Pix, cartão com parcelamento e boleto. Não queremos
travar a escolha final do provedor nem acoplar o domínio a um SDK específico.

## Opções consideradas

1. **Port `PaymentGateway`** (interface) + adapters: `fake` (dev/testes), `asaas` (sandbox), `pagarme` depois.
2. Acoplar direto ao SDK do provedor — simples no começo, caro de trocar.

## Decisão

Modelar um **port `PaymentGateway`** no domínio. Fase 1 usa o adapter **`fake`**
em dev e **Asaas sandbox** para integração real. A escolha definitiva
Pagar.me vs Asaas será registrada em novo ADR na contratação. Webhooks de
confirmação são **verificados por HMAC**; escritas usam idempotency-key; o
evento `payment.confirmed` dispara a matrícula.

## Consequências

Domínio isolado do provedor; troca de gateway sem reescrever regra de negócio.
Testes de checkout rodam sem rede via adapter `fake`.
