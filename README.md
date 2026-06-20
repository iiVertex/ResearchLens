# ResearchLens

A web-based Q&A assistant for academic PDFs. Upload a paper, ask questions in plain
English, and get answers **grounded in the document** with page citations (`[p. 3]`) so you
can verify every claim.

- **Frontend:** Next.js 16 / React 19 / Tailwind 4 (landing page uses Three.js + GSAP)
- **AI:** [CometAPI](https://cometapi.com) (OpenAI-compatible) — `claude-sonnet-4-6` for answers,
  `text-embedding-3-small` for retrieval
- **Storage / Auth:** Supabase (Postgres + `pgvector`, Storage, Auth)

## How it works (RAG pipeline)

1. **Upload** → the PDF is stored in Supabase Storage and a `documents` row is created.
2. **Ingest** → `unpdf` extracts per-page text, which is chunked (page-tagged), embedded via
   CometAPI, and stored in `pgvector`.
3. **Ask** → the question is embedded, the top-k most similar chunks **for that document** are
   retrieved, and `claude-sonnet-4-6` answers **using only those passages**, citing pages inline as
   `[p. N]`. The answer streams to the browser; citations render as chips.

Everything is per-user and isolated by Postgres Row Level Security.

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   This creates the tables, the `pgvector` index, the `match_chunks` retrieval function, RLS
   policies, and the private `papers` storage bucket.
3. From **Settings → API**, copy the project URL, the `anon` key, and the `service_role` key.
4. (Dev convenience) Under **Authentication → Providers → Email**, you may turn off
   "Confirm email" so sign-up logs you straight in.

### 3. CometAPI

Get an API key from your CometAPI dashboard. The default base URL is
`https://api.cometapi.com/v1`. Confirm your plan exposes the **embeddings** endpoint
(`text-embedding-3-small`). If it doesn't, swap the `embed()` implementation in
[`lib/ai.ts`](lib/ai.ts) for a fallback embeddings provider — that's the only place to change.

### 4. Environment

```bash
cp .env.example .env.local   # then fill in your keys
```

### 5. Run

```bash
pnpm dev      # http://localhost:3000
```

## Verify end-to-end

1. Sign up → land on an empty dashboard showing your email.
2. Upload an academic PDF; watch it go `processing → ready` (a green dot in the sidebar).
3. Ask *"What problem does this paper solve?"* — the answer streams in with `[p. N]` chips.
   Spot-check that the cited pages actually contain the claim.
4. Ask something **not** in the paper — it should decline rather than hallucinate.
5. Reload — documents and conversation history persist. Sign in as a second account to confirm
   you can't see the first account's data (RLS).

## Project layout

```
app/                    Next.js routes
  api/                  chat (streaming), documents, conversations
  dashboard/            authenticated app (server page → DashboardClient)
  login, signup         Supabase Auth
components/
  landing/              hero (Three.js particle field), features, etc.
  dashboard/            sidebar, chat area, client orchestrator, pdf-panel (react-pdf viewer)
lib/
  ai.ts                 CometAPI client (chat + embeddings)
  chunking.ts           PDF → page-aware chunks (unpdf)
  ingest.ts             parse → embed → store
  rag.ts                retrieve + prompt building
  citations.ts          [p. N] parsing helpers + Source type
  supabase/             browser / server / admin clients + DB types
supabase/migrations/    schema + RLS + match_chunks
Inspiration/            original static UI prototype (reference only)
```

## Citations & the PDF viewer

Each assistant answer cites pages inline as `[p. N]`, rendered as clickable chips. The retrieved
source passages are persisted on the message (`messages.sources`). Clicking a chip opens a
resizable PDF panel (`react-pdf`) that jumps to the cited page and **highlights the exact passage
text**. Messages created before this feature have no `sources` and fall back to a plain page-jump.

## Notes / deferred

- Ingestion runs synchronously in the request — fine for typical papers; move to a background
  queue for very large PDFs.
- Next 16 prefers a `proxy.ts` over `middleware.ts`; the current `middleware.ts` works (with a
  deprecation warning) and matches the Supabase SSR docs.
- Open advisor notes (non-blocking): `vector` extension lives in the `public` schema; Auth
  "leaked password protection" is off (enable in the Supabase dashboard).
