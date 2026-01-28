CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"sku" text NOT NULL,
	"ean" text,
	"price" integer NOT NULL,
	"weight_kg" numeric(10, 3) NOT NULL,
	"height_cm" numeric(10, 2) NOT NULL,
	"width_cm" numeric(10, 2) NOT NULL,
	"depth_cm" numeric(10, 2) NOT NULL,
	"images" text[] DEFAULT '{}' NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "products_user_id_index" ON "products" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variants_user_id_sku_index" ON "variants" USING btree ("user_id","sku");--> statement-breakpoint
CREATE INDEX "variants_product_id_index" ON "variants" USING btree ("product_id");