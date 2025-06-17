CREATE TABLE "password_resets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"code" text NOT NULL,
	"expiration" timestamp (3) NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "password_resets_user_id_index" ON "password_resets" USING btree ("user_id");