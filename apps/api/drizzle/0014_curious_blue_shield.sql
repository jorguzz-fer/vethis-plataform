-- Remove regras duplicadas (mesmo canal + utm_source + utm_medium), mantendo a mais
-- antiga. Elas surgiram porque a unique (channel_id, utm_source, utm_medium) não
-- cobre utm_medium NULL: cada seed/insert criava "meta", "tiktok"… de novo.
DELETE FROM "channel_rules" r
USING "channel_rules" k
WHERE r."channel_id" = k."channel_id"
  AND r."utm_source" = k."utm_source"
  AND r."utm_medium" IS NOT DISTINCT FROM k."utm_medium"
  AND (k."created_at", k."id") < (r."created_at", r."id");
--> statement-breakpoint
CREATE UNIQUE INDEX "channel_rules_no_medium_uq" ON "channel_rules" USING btree ("channel_id","utm_source") WHERE "channel_rules"."utm_medium" is null;
