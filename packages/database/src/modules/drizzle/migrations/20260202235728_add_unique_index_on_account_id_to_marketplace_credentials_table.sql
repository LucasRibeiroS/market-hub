DROP INDEX "marketplace_credentials_account_id_index";--> statement-breakpoint
CREATE UNIQUE INDEX "marketplace_credentials_account_id_index" ON "marketplace_credentials" USING btree ("account_id");