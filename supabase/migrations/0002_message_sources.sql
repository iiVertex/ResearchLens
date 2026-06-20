-- Persist the retrieved source passages alongside each assistant answer so the
-- UI can open the PDF to a citation's page and highlight the exact passage text.
-- Shape: jsonb array of { page, chunk_index, content } (the top-k retrieved chunks).
-- Nullable: pre-existing messages have no sources and fall back to page-jump.

alter table public.messages add column if not exists sources jsonb;
