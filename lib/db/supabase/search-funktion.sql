create extension if not exists vector;
DROP FUNCTION IF EXISTS match_furnitures_with_filter(vector,double precision,integer,jsonb);

CREATE OR REPLACE FUNCTION match_furnitures_with_filter (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter jsonb DEFAULT '{}'::jsonb
) 
RETURNS TABLE (
  id text,
  name text,
  price decimal,
  image_url text,
  product_url text,
  condition text,
  metadata jsonb,
  similarity float,
  company text
)
LANGUAGE plpgsql AS $$
DECLARE
  color_filter jsonb := filter -> 'colors';
  metadata_filter jsonb := filter - 'colors';
BEGIN
  RETURN QUERY
  SELECT
    products.id,
    products.name,
    products.price::decimal,
    products.image_url,
    products.product_url,
    products.condition,
    products.metadata,
    1 - (products.embedding <=> query_embedding) as similarity,
    products.company
  FROM products
  WHERE 1 - (products.embedding <=> query_embedding) > match_threshold
    AND (
      filter = '{}'::jsonb
      OR (
        -- Tarkista muut metadata-kentät paitsi värit
            products.metadata @> metadata_filter
        AND
        -- Tarkista värit: palauta true jos yksikin väri täsmää
        (
          color_filter IS NULL
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(color_filter) AS filter_color
            WHERE filter_color IN (
              SELECT jsonb_array_elements_text(products.metadata -> 'colors')
            )
          )
        )
      )
    )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

create index idx_products_metadata on products using gin (metadata);