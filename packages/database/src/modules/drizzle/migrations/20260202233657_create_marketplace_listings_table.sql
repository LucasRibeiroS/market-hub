CREATE TYPE "listing_status" AS ENUM('pending', 'active', 'paused', 'error');--> statement-breakpoint
CREATE TABLE "marketplace_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"variant_id" text NOT NULL,
	"account_id" text NOT NULL,
	"external_id" text NOT NULL,
	"status" "listing_status" DEFAULT 'pending' NOT NULL,
	"last_sync_at" timestamp (3),
	"sync_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_account_id_marketplace_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."marketplace_accounts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "marketplace_listings_variant_id_account_id_index" ON "marketplace_listings" USING btree ("variant_id","account_id");--> statement-breakpoint
CREATE INDEX "marketplace_listings_external_id_index" ON "marketplace_listings" USING btree ("external_id");