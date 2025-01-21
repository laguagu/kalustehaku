create extension if not exists vector;

DROP FUNCTION IF EXISTS test_match_furnitures_with_filter(vector,double precision,integer,jsonb);

CREATE OR REPLACE FUNCTION test_match_furnitures_with_filter (
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
    test_products.id,
    test_products.name,
    test_products.price::decimal,
    test_products.image_url,
    test_products.product_url,
    test_products.condition,
    test_products.metadata,
    1 - (test_products.embedding <=> query_embedding) as similarity,
    test_products.company
  FROM test_products
  WHERE 1 - (test_products.embedding <=> query_embedding) > match_threshold
    AND (
      filter = '{}'::jsonb
      OR (
        -- Tarkista muut metadata-kentät paitsi värit
            test_products.metadata @> metadata_filter
        AND
        -- Tarkista värit: palauta true jos yksikin väri täsmää
        (
          color_filter IS NULL
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(color_filter) AS filter_color
            WHERE filter_color IN (
              SELECT jsonb_array_elements_text(test_products.metadata -> 'colors')
            )
          )
        )
      )
    )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

create index idx_test_products_metadata on test_products using gin (metadata);