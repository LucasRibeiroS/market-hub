CREATE TYPE "order_status" AS ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "shipment_status" AS ENUM('pending', 'invoiced', 'shipped', 'delivered', 'returned', 'cancelled');--> statement-breakpoint
CREATE TABLE "order_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"shipment_id" text,
	"invoice_number" text NOT NULL,
	"invoice_key" text,
	"invoice_url" text,
	"issued_at" timestamp (3),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"variant_id" text,
	"listing_id" text,
	"external_item_id" text NOT NULL,
	"external_variant_id" text,
	"title" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_amount" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_shipments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"external_shipment_id" text NOT NULL,
	"status" "shipment_status" DEFAULT 'pending' NOT NULL,
	"carrier" text,
	"tracking_number" text,
	"tracking_url" text,
	"shipping_street" text,
	"shipping_number" text,
	"shipping_complement" text,
	"shipping_district" text,
	"shipping_city" text,
	"shipping_state" text,
	"shipping_zip_code" text,
	"shipped_at" timestamp (3),
	"estimated_delivery_at" timestamp (3),
	"delivered_at" timestamp (3),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"external_order_id" text NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"external_status" text NOT NULL,
	"total_amount" integer NOT NULL,
	"shipping_amount" integer DEFAULT 0 NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"buyer_name" text,
	"buyer_document" text,
	"buyer_email" text,
	"buyer_phone" text,
	"ordered_at" timestamp (3) NOT NULL,
	"approved_at" timestamp (3),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_invoices" ADD CONSTRAINT "order_invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_invoices" ADD CONSTRAINT "order_invoices_shipment_id_order_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."order_shipments"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_account_id_marketplace_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."marketplace_accounts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "order_invoices_order_id_index" ON "order_invoices" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_invoices_shipment_id_index" ON "order_invoices" USING btree ("shipment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_invoices_order_id_invoice_number_index" ON "order_invoices" USING btree ("order_id","invoice_number");--> statement-breakpoint
CREATE INDEX "order_items_order_id_index" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_variant_id_index" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "order_shipments_order_id_index" ON "order_shipments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_account_id_external_order_id_index" ON "orders" USING btree ("account_id","external_order_id");--> statement-breakpoint
CREATE INDEX "orders_user_id_index" ON "orders" USING btree ("user_id");