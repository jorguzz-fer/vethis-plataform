ALTER TABLE "courses" ADD COLUMN "workload_hours" integer;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "learning_objectives" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "faq" jsonb DEFAULT '[]'::jsonb NOT NULL;