import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

// Service-role client that BYPASSES RLS. Server-only — never import this into a
// client component. Used by the ingestion pipeline to bulk-insert chunks after
// we've already verified the caller owns the document.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
