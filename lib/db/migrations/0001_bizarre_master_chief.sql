ALTER TABLE "products" ALTER COLUMN "metadata" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_url" text;