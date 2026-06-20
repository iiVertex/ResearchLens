import { createClient } from "@/lib/supabase/server"

// Minimal authenticated identity, read from the verified JWT claims.
export type AuthUser = { id: string; email: string | null }

// Returns the signed-in user for a route handler / server action, or null.
//
// Uses `getClaims()` instead of `getUser()`. With asymmetric JWT signing keys
// enabled on the Supabase project, this verifies the access token locally (no
// network round-trip to the auth server) — a big latency win, since this runs
// on every API request. With legacy HS256 keys it transparently falls back to
// a network `getUser()`, so there's no behavioural change until keys are rotated.
export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (error || !claims?.sub) return null
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  }
}
