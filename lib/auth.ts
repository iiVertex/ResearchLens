import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

// Returns the signed-in user for a route handler / server action, or null.
export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
