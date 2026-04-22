ALTER TABLE "marketplace_providers" ADD COLUMN "token_url" text;--> statement-breakpoint
UPDATE "marketplace_providers" SET "token_url" = "base_url" WHERE "token_url" IS NULL;--> statement-breakpoint
ALTER TABLE "marketplace_providers" ALTER COLUMN "token_url" SET NOT NULL;