CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"condition" text,
	"image_url" text,
	"category" text,
	"availability" text,
	"metadata" json,
	"embedding" vector(1536),
	"search_terms" text,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);

-- Create HNSW index for better performance
CREATE INDEX IF NOT EXISTS "embeddingIndex" 
ON "products" 
USING hnsw ("embedding" vector_cosine_ops)
WITH (
  m = 16,
  ef_construction = 64
);

-- Create similarity search function
CREATE OR REPLACE FUNCTION match_furniture(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
) RETURNS TABLE (id text, name text, similarity float) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    products.id,
    products.name,
    1 - (products.embedding <=> query_embedding) as similarity
  FROM products
  WHERE 1 - (products.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;