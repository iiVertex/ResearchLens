import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const STORAGE_BUCKET = "papers"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("documents")
    .select("id, name, status, num_pages, error, created_at")
    .eq("id", id)
    .single()
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ document: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createClient()
  const { data: doc } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", id)
    .single()
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Remove the stored PDF; chunks/conversations cascade via FK on row delete.
  await supabase.storage.from(STORAGE_BUCKET).remove([doc.storage_path])
  const { error } = await supabase.from("documents").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
