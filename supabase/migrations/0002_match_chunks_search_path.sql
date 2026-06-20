-- Security hardening: pin the function's search_path so it can't be hijacked by
-- a malicious schema on the session search_path (flagged by Supabase's advisor).
-- Recreates match_chunks identically to 0001 but with an explicit search_path.

create or replace function public.match_chunks (
  p_document_id     uuid,
  p_query_embedding vector(1536),
  p_match_count     int
)
returns table (
  id          uuid,
  content     text,
  page        int,
  chunk_index int,
  similarity  float
)
language sql
stable
set search_path = 'public', 'extensions'
as $$
  select
    c.id,
    c.content,
    c.page,
    c.chunk_index,
    1 - (c.embedding <=> p_query_embedding) as similarity
  from public.chunks c
  where c.document_id = p_document_id
    and c.embedding is not null
  order by c.embedding <=> p_query_embedding
  limit p_match_count;
$$;
