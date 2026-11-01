ALTER TABLE "courses" ALTER COLUMN "max_installments" SET DEFAULT 15;
--> statement-breakpoint
-- Teto de parcelas cai de 24x para 15x (cartão e carnê). Planos acima de 15x
-- viram um plano de 15x com o MESMO total (ex.: 24x de 577 = 13.848 → 15x de
-- 923,20); planos de até 15x ficam como estão. Se o curso já tiver um plano de
-- 15x, os planos acima dele são apenas removidos.
UPDATE "courses" AS c
SET "installment_plans" = (
  SELECT COALESCE(jsonb_agg(p ORDER BY (p->>'installments')::int), '[]'::jsonb)
  FROM (
    SELECT e AS p
    FROM jsonb_array_elements(c."installment_plans") AS e
    WHERE (e->>'installments')::int <= 15
    UNION ALL
    SELECT jsonb_build_object(
      'installments', 15,
      'installmentCents',
      round(((big->>'installments')::numeric * (big->>'installmentCents')::numeric) / 15)::int
    )
    FROM (
      SELECT e AS big
      FROM jsonb_array_elements(c."installment_plans") AS e
      WHERE (e->>'installments')::int > 15
      ORDER BY (e->>'installments')::int DESC
      LIMIT 1
    ) AS largest
    WHERE NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(c."installment_plans") AS e2
      WHERE (e2->>'installments')::int = 15
    )
  ) AS plans
)
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(c."installment_plans") AS e
  WHERE (e->>'installments')::int > 15
);
--> statement-breakpoint
-- Sem planos, o preço é dividido sem juros até o teto: 24x → 15x mantém o total.
UPDATE "courses" SET "max_installments" = 15 WHERE "max_installments" > 15;
--> statement-breakpoint
-- Textos de pagamento do FAQ que citam as ofertas antigas de 24x.
UPDATE "courses"
SET "faq" = replace(
  replace(
    replace("faq"::text, '24x de R$ 1.277,00', '15x de R$ 2.043,20'),
    '24x de R$ 577,00', '15x de R$ 923,20'
  ),
  '24x de R$ 625,00', '15x de R$ 1.000,00'
)::jsonb
WHERE "faq"::text LIKE '%24x de R$%';
