import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { processDocument } from "@/lib/ingest"

// Run (or retry) ingestion for a document the caller owns. Synchronous: resolves
// once the PDF is parsed, embedded, and stored. Fine for typical papers; for
// very large PDFs this could be moved to a background queue later.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Ownership check via RLS: this select only returns the row if it's theirs.
  const supabase = await createClient()
  const { data: doc, error } = await supabase
    .from("documents")
    .select("id")
    .eq("id", id)
    .single()
  if (error || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    await processDocument(id)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed"
    return NextResponse.json({ error: message, status: "error" }, { status: 500 })
  }

  const { data: updated } = await supabase
    .from("documents")
    .select("id, name, status, num_pages, error, created_at")
    .eq("id", id)
    .single()

  return NextResponse.json({ document: updated })
}
