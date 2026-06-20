import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const STORAGE_BUCKET = "papers"
const SIGNED_URL_TTL = 600 // seconds

// Mint a short-lived signed URL for the caller's PDF so the browser can render it
// in the citation viewer. Ownership is enforced by RLS on the documents select.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // RLS: this only returns the row if the document belongs to the caller.
  const supabase = await createClient()
  const { data: doc, error } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .single()
  if (error || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data, error: signErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(doc.storage_path, SIGNED_URL_TTL)
  if (signErr || !data) {
    return NextResponse.json(
      { error: signErr?.message ?? "Could not sign URL" },
      { status: 500 },
    )
  }

  return NextResponse.json({ url: data.signedUrl })
}
