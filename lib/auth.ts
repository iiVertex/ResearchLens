import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { USER_ID_HEADER, USER_EMAIL_HEADER } from "@/lib/auth-headers"

// Minimal authenticated identity, read from the verified JWT claims.
export type AuthUser = { id: string; email: string | null }

// Returns the signed-in user for a route handler / server action, or null.
//
// Fast path: the middleware (lib/supabase/middleware.ts) already verified the
// JWT for this request and forwarded the user id/email as request headers, so we
// trust those instead of making a second network verification. This is the main
// per-request latency win — tiny API calls were paying for two auth round-trips.
//
// Fallback: in any context the middleware didn't run, verify directly via
// getClaims() (which is local once asymmetric JWT signing keys are enabled,
// network otherwise).
export async function getUser(): Promise<AuthUser | null> {
  const h = await headers()
  const id = h.get(USER_ID_HEADER)
  if (id) {
    return { id, email: h.get(USER_EMAIL_HEADER) }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (error || !claims?.sub) return null
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  }
}
