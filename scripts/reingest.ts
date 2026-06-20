// One-off migration: re-chunk + re-embed every real document with the current
// (smaller) CHUNK_SIZE, so cited passages highlight a paragraph instead of the
// whole page. Run once after changing lib/chunking.ts:
//
//   npx tsx scripts/reingest.ts
//
// Idempotent: it replaces each document's chunks. Safe to re-run.

import { readFileSync } from "node:fs"

// Load .env.local into process.env BEFORE importing modules that read env at
// import time (lib/ai.ts captures COMETAPI_KEY on load).
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const line = raw.trim()
  if (!line || line.startsWith("#")) continue
  const eq = line.indexOf("=")
  if (eq === -1) continue
  const key = line.slice(0, eq).trim()
  let val = line.slice(eq + 1).trim()
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1)
  }
  if (!(key in process.env)) process.env[key] = val
}

// Sample rows from the assignment (no real PDF in Storage) — never reprocess.
const SAMPLE_IDS = [
  "11111111-1111-1111-1111-111111111111",
  "22222222-2222-2222-2222-222222222222",
  "33333333-3333-3333-3333-333333333333",
]

const EMBED_BATCH = 64
const toVectorLiteral = (v: number[]) => `[${v.join(",")}]`

async function main() {
  const { parsePdf } = await import("../lib/chunking")
  const { embed } = await import("../lib/ai")
  const { createClient } = await import("@supabase/supabase-js")

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const { data: docs, error } = await admin
    .from("documents")
    .select("id, name, storage_path")
    .not("id", "in", `(${SAMPLE_IDS.join(",")})`)
  if (error) throw new Error(error.message)
  if (!docs?.length) {
    console.log("No documents to re-ingest.")
    return
  }

  console.log(`Re-ingesting ${docs.length} document(s)…\n`)

  for (const doc of docs) {
    process.stdout.write(`• ${doc.name} … `)
    try {
      const { data: file, error: dlErr } = await admin.storage
        .from("papers")
        .download(doc.storage_path)
      if (dlErr || !file) throw new Error(dlErr?.message ?? "download failed")

      const { numPages, chunks } = await parsePdf(await file.arrayBuffer())
      if (chunks.length === 0) throw new Error("no extractable text")

      await admin.from("chunks").delete().eq("document_id", doc.id)

      for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
        const batch = chunks.slice(i, i + EMBED_BATCH)
        const vectors = await embed(batch.map((c) => c.content))
        const rows = batch.map((c, j) => ({
          document_id: doc.id,
          content: c.content,
          page: c.page,
          chunk_index: c.chunk_index,
          embedding: toVectorLiteral(vectors[j]),
        }))
        const { error: insErr } = await admin.from("chunks").insert(rows)
        if (insErr) throw new Error(insErr.message)
      }

      await admin
        .from("documents")
        .update({ status: "ready", num_pages: numPages, error: null })
        .eq("id", doc.id)

      console.log(`ok (${chunks.length} chunks)`)
    } catch (e) {
      console.log(`FAILED: ${e instanceof Error ? e.message : e}`)
    }
  }

  console.log("\nDone.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
