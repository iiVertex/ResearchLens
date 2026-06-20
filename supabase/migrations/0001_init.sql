-- ResearchLens initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Multi-user RAG store: documents, page-aware chunks (pgvector), conversations, messages.

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists vector;

-- ── documents ───────────────────────────────────────────────────────────────
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  storage_path text not null,
  status       text not null default 'processing'
                 check (status in ('processing', 'ready', 'error')),
  num_pages    int,
  error        text,
  created_at   timestamptz not null default now()
);
create index if not exists documents_user_id_idx on public.documents (user_id);

-- ── chunks ──────────────────────────────────────────────────────────────────
-- One row per chunk of text, tagged with the source page so answers can cite it.
-- embedding dimension (1536) MUST match EMBEDDING_DIM in lib/ai.ts.
create table if not exists public.chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  content     text not null,
  page        int  not null,
  chunk_index int  not null,
  embedding   vector(1536),
  created_at  timestamptz not null default now()
);
create index if not exists chunks_document_id_idx on public.chunks (document_id);
-- Approximate-nearest-neighbour index for cosine similarity search.
create index if not exists chunks_embedding_idx
  on public.chunks using hnsw (embedding vector_cosine_ops);

-- ── conversations ───────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  title       text not null,
  created_at  timestamptz not null default now()
);
create index if not exists conversations_user_id_idx on public.conversations (user_id);
create index if not exists conversations_document_id_idx on public.conversations (document_id);

-- ── messages ────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  citations       jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conversation_id_idx on public.messages (conversation_id);

-- ── Retrieval RPC ───────────────────────────────────────────────────────────
-- Top-k cosine similarity within a single document. Called from lib/rag.ts.
-- SECURITY INVOKER + the RLS policies below mean callers only ever match their
-- own document's chunks.
create or replace function public.match_chunks (
  p_document_id   uuid,
  p_query_embedding vector(1536),
  p_match_count   int
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

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.documents     enable row level security;
alter table public.chunks        enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

-- documents: owner-only.
create policy "documents_owner_all" on public.documents
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- chunks: scoped through the parent document's owner.
create policy "chunks_owner_all" on public.chunks
  for all using (
    exists (
      select 1 from public.documents d
      where d.id = chunks.document_id and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.documents d
      where d.id = chunks.document_id and d.user_id = auth.uid()
    )
  );

-- conversations: owner-only.
create policy "conversations_owner_all" on public.conversations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- messages: scoped through the parent conversation's owner.
create policy "messages_owner_all" on public.messages
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- ── Storage bucket for the raw PDFs ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('papers', 'papers', false)
on conflict (id) do nothing;

-- Owner-only access to objects under a `<user_id>/...` path prefix.
create policy "papers_owner_select" on storage.objects
  for select using (
    bucket_id = 'papers' and owner = auth.uid()
  );
create policy "papers_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'papers' and owner = auth.uid()
  );
create policy "papers_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'papers' and owner = auth.uid()
  );
