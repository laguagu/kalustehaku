create extension if not exists vector;

CREATE INDEX IF NOT EXISTS embeddingIndex 
ON products 
USING hnsw (embedding vector_cosine_ops);

create or replace function match_furniture (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
) 
returns table (
  id text,
  name text,
  price decimal,
  image_url text,
  product_url text,
  condition text,
  metadata jsonb,
  similarity float
)
language plpgsql as $$
BEGIN
  RETURN QUERY
  SELECT
    products.id,
    products.name,
    products.price::decimal,
    products.image_url,
    products.product_url,
    products.condition,
    products.metadata::jsonb,
    1 - (products.embedding <=> query_embedding) as similarity
  FROM products
  WHERE 1 - (products.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

DROP FUNCTION IF EXISTS match_furniture CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP EXTENSION IF EXISTS vector CASCADE;