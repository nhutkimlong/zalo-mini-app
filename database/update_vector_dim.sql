-- SQL Script to update vector dimension on Supabase Cloud
-- Alter knowledge_chunks.embedding vector dimension to 3072
-- Recreate match_chunks RPC function to support 3072-dimensional vector similarity search.

-- 1. Alter the column type to vector(3072)
-- Since the existing vector index might be on vector(1536), we must alter the column.
-- Note: If you have existing data, you may need to truncate the table or let it alter.
-- In this development stage, we can safely alter the column or truncate knowledge_chunks first:
-- TRUNCATE TABLE knowledge_chunks CASCADE;

ALTER TABLE knowledge_chunks ALTER COLUMN embedding TYPE vector(3072);

-- 2. Recreate match_chunks function with 3072 dimension
CREATE OR REPLACE FUNCTION match_chunks (
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  filter_visibility text default 'public'
)
RETURNS TABLE (
  id uuid,
  article_id uuid,
  chunk_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.article_id,
    kc.chunk_text,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) as similarity
  FROM knowledge_chunks kc
  JOIN knowledge_articles ka ON kc.article_id = ka.id
  WHERE ka.visibility = filter_visibility AND ka.status = 'published'
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
