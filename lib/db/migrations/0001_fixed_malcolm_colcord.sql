/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'products'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "products" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "unique_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_product_source" ON "products" USING btree ("id","company");