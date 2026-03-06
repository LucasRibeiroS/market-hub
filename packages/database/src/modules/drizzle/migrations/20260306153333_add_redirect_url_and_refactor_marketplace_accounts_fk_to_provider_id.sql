ALTER TABLE "marketplace_accounts" DROP CONSTRAINT "marketplace_accounts_provider_marketplace_providers_provider_fk";
ALTER TABLE "marketplace_providers" DROP CONSTRAINT "marketplace_providers_provider_unique";--> statement-breakpoint
--> statement-breakpoint
DROP INDEX "marketplace_accounts_user_id_provider_index";--> statement-breakpoint
ALTER TABLE "marketplace_providers" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "marketplace_accounts" ADD COLUMN "provider_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "marketplace_providers" ADD COLUMN "redirect_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "marketplace_accounts" ADD CONSTRAINT "marketplace_accounts_provider_id_marketplace_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."marketplace_providers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "marketplace_accounts_user_id_provider_id_index" ON "marketplace_accounts" USING btree ("user_id","provider_id");--> statement-breakpoint
ALTER TABLE "marketplace_accounts" DROP COLUMN "provider";