ALTER TABLE "marketplace_listings" RENAME COLUMN "external_id" TO "external_product_id";--> statement-breakpoint
ALTER TABLE "marketplace_listings" ALTER COLUMN "external_product_id" DROP NOT NULL;--> statement-breakpoint
DROP INDEX "marketplace_listings_external_id_index";--> statement-breakpoint
ALTER TABLE "marketplace_listings" ALTER COLUMN "metadata" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD COLUMN "external_variant_id" text;--> statement-breakpoint
CREATE INDEX "marketplace_listings_external_product_id_index" ON "marketplace_listings" USING btree ("external_product_id");