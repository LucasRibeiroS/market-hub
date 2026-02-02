CREATE TYPE "account_status" AS ENUM('active', 'disconnected', 'expired', 'revoked', 'error');--> statement-breakpoint
CREATE TYPE "provider" AS ENUM('mercado_livre', 'magalu');--> statement-breakpoint
CREATE TABLE "marketplace_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" "provider" NOT NULL,
	"external_id" text NOT NULL,
	"external_email" text,
	"status" "account_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"access_token_expires_at" timestamp (3) NOT NULL,
	"refresh_token_expires_at" timestamp (3) NOT NULL,
	"scopes" jsonb,
	"token_type" text DEFAULT 'Bearer'
);
--> statement-breakpoint
CREATE TABLE "marketplace_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" "provider" NOT NULL,
	"display_name" text NOT NULL,
	"auth_url" text NOT NULL,
	"token_url" text NOT NULL,
	"client_id" text NOT NULL,
	"client_secret" text NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "marketplace_providers_provider_unique" UNIQUE("provider")
);
--> statement-breakpoint
CREATE TABLE "marketplace_webhooks" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"external_webhook_id" text NOT NULL,
	"topic" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketplace_accounts" ADD CONSTRAINT "marketplace_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "marketplace_accounts" ADD CONSTRAINT "marketplace_accounts_provider_marketplace_providers_provider_fk" FOREIGN KEY ("provider") REFERENCES "public"."marketplace_providers"("provider") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "marketplace_credentials" ADD CONSTRAINT "marketplace_credentials_account_id_marketplace_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."marketplace_accounts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "marketplace_webhooks" ADD CONSTRAINT "marketplace_webhooks_account_id_marketplace_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."marketplace_accounts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "marketplace_accounts_user_id_provider_index" ON "marketplace_accounts" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "marketplace_credentials_account_id_index" ON "marketplace_credentials" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "marketplace_webhooks_account_id_topic_index" ON "marketplace_webhooks" USING btree ("account_id","topic");