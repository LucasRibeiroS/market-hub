ALTER TABLE "api_keys" RENAME COLUMN "public_key" TO "encrypted_key";--> statement-breakpoint
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_public_key_unique";--> statement-breakpoint
DROP INDEX "api_keys_public_key_index";--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "key_lookup" text NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "key_preview" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_key_lookup_index" ON "api_keys" USING btree ("key_lookup");