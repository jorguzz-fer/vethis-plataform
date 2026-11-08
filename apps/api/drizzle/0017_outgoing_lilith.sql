CREATE TABLE "creative_reviews" (
	"key" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"reviewer" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
