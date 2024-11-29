CREATE TABLE IF NOT EXISTS "products" (
	"unique_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"condition" text,
	"image_url" text,
	"product_url" text,
	"category" text,
	"availability" text,
	"company" text NOT NULL,
	"is_test_data" boolean DEFAULT false,
	"metadata" jsonb NOT NULL,
	"embedding" vector(1536),
	"search_terms" text,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_product_source" ON "products" USING btree ("id","company");