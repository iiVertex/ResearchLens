import { embed } from "@/lib/ai"
import { parsePdf } from "@/lib/chunking"
import { createAdminClient } from "@/lib/supabase/admin"

const STORAGE_BUCKET = "papers"
const EMBED_BATCH = 64 // chunks per embeddings request
const EMBED_CONCURRENCY = 5 // embedding requests in flight at once

function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`
}

// Parse → chunk → embed → store. Idempotent-ish: clears any existing chunks for
// the document first so a re-run after an error doesn't duplicate rows.
// Uses the service-role client (RLS already enforced at the API layer).
export async function processDocument(documentId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id, storage_path")
    .eq("id", documentId)
    .single()
  if (docErr || !doc) throw new Error(docErr?.message ?? "Document not found")

  try {
    // 1. Download the raw PDF from Storage.
    const { data: file, error: dlErr } = await admin.storage
      .from(STORAGE_BUCKET)
      .download(doc.storage_path)
    if (dlErr || !file) throw new Error(dlErr?.message ?? "Download failed")

    // 2. Parse into page-aware chunks.
    const buffer = await file.arrayBuffer()
    const tParse = Date.now()
    const { numPages, chunks } = await parsePdf(buffer)
    if (chunks.length === 0) {
      throw new Error("No extractable text — is this a scanned/image-only PDF?")
    }
    console.log(
      `[ingest ${documentId}] parsed ${numPages}p → ${chunks.length} chunks in ${Date.now() - tParse}ms`,
    )

    // 3. Clear stale chunks, then embed + insert batches with bounded
    // concurrency. The embedding round-trips dominate processing time, so we run
    // several in parallel instead of strictly one-after-another.
    await admin.from("chunks").delete().eq("document_id", documentId)

    const batches: (typeof chunks)[] = []
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      batches.push(chunks.slice(i, i + EMBED_BATCH))
    }

    const tEmbed = Date.now()
    let nextBatch = 0
    let aborted = false
    const worker = async () => {
      while (!aborted) {
        const idx = nextBatch++
        if (idx >= batches.length) return
        const batch = batches[idx]
        try {
          const vectors = await embed(batch.map((c) => c.content))
          const rows = batch.map((c, j) => ({
            document_id: documentId,
            content: c.content,
            page: c.page,
            chunk_index: c.chunk_index,
            embedding: toVectorLiteral(vectors[j]),
          }))
          const { error: insErr } = await admin.from("chunks").insert(rows)
          if (insErr) throw new Error(insErr.message)
        } catch (e) {
          aborted = true // stop the other workers from starting new batches
          throw e
        }
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(EMBED_CONCURRENCY, batches.length) }, worker),
    )
    console.log(
      `[ingest ${documentId}] embedded + stored ${chunks.length} chunks in ${Date.now() - tEmbed}ms`,
    )

    // 4. Mark ready.
    const { error: upErr } = await admin
      .from("documents")
      .update({ status: "ready", num_pages: numPages, error: null })
      .eq("id", documentId)
    if (upErr) throw new Error(upErr.message)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed"
    await admin
      .from("documents")
      .update({ status: "error", error: message })
      .eq("id", documentId)
    throw err
  }
}
