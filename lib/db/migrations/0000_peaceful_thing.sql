ALTER TABLE "products" 
ADD COLUMN "company" text NOT NULL DEFAULT 'Tavara-Trading',
ADD COLUMN "is_test_data" boolean NOT NULL DEFAULT false;