import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

// Fetch a conversation's messages (oldest first), with its document context.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createClient()

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, document_id, title, created_at")
    .eq("id", id)
    .single()
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, role, content, citations, sources, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ conversation, messages })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createClient()
  const { error } = await supabase.from("conversations").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
