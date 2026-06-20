import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

// List the user's conversations, optionally filtered to one document.
export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const documentId = new URL(request.url).searchParams.get("documentId")

  const supabase = await createClient()
  let query = supabase
    .from("conversations")
    .select("id, document_id, title, created_at")
    .order("created_at", { ascending: false })
  if (documentId) query = query.eq("document_id", documentId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ conversations: data })
}
