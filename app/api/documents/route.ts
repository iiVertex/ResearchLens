import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const STORAGE_BUCKET = "papers"
const MAX_BYTES = 30 * 1024 * 1024 // 30 MB

// List the signed-in user's documents (newest first).
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("documents")
    .select("id, name, status, num_pages, error, created_at")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documents: data })
}

// Upload a PDF: store the file, create a `processing` document row.
// The client should then call POST /api/documents/[id]/process.
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 30 MB" }, { status: 400 })
  }

  const supabase = await createClient()
  const docId = crypto.randomUUID()
  const storagePath = `${user.id}/${docId}.pdf`

  const { error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, { contentType: "application/pdf", upsert: false })
  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data: document, error: insertErr } = await supabase
    .from("documents")
    .insert({
      id: docId,
      user_id: user.id,
      name: file.name,
      storage_path: storagePath,
      status: "processing",
    })
    .select("id, name, status, num_pages, error, created_at")
    .single()

  if (insertErr) {
    // Best-effort cleanup of the orphaned object.
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ document }, { status: 201 })
}
