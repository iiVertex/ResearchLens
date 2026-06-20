import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/lib/supabase/types"
import { USER_ID_HEADER, USER_EMAIL_HEADER } from "@/lib/auth-headers"

// Refreshes the auth session on every request and guards private routes.
// Adapted from the @supabase/ssr Next.js App Router pattern.
//
// It also forwards the verified user id/email to downstream route handlers and
// server components as request headers, so they don't each make a second network
// JWT verification — the middleware already verified it once here.
export async function updateSession(request: NextRequest) {
  // Start from the incoming headers but strip any client-supplied identity
  // headers: only the middleware (below) is allowed to set them, so a client
  // can't spoof another user's id.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete(USER_ID_HEADER)
  requestHeaders.delete(USER_EMAIL_HEADER)

  // Cookies the Supabase client wants written back (refreshed tokens). Collected
  // here and applied to whatever response we ultimately return.
  const cookiesToSet: {
    name: string
    value: string
    options: Record<string, unknown>
  }[] = []

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.push(...toSet)
        },
      },
    },
  )

  // IMPORTANT: do not run code between createServerClient and getClaims().
  // getClaims() verifies the JWT locally when asymmetric signing keys are
  // enabled (no auth-server round-trip); it falls back to a network getUser()
  // for legacy HS256 keys.
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims ?? null

  // Forward the verified identity to downstream handlers (see lib/auth.ts).
  if (claims?.sub) {
    requestHeaders.set(USER_ID_HEADER, claims.sub)
    if (typeof claims.email === "string") {
      requestHeaders.set(USER_EMAIL_HEADER, claims.email)
    }
  }

  const { pathname } = request.nextUrl
  const isProtected = pathname.startsWith("/dashboard")
  const isAuthPage = pathname === "/login" || pathname === "/signup"

  // Apply collected cookies to a response before returning it.
  const withCookies = (response: NextResponse) => {
    cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options),
    )
    return response
  }

  if (!claims && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirectedFrom", pathname)
    return withCookies(NextResponse.redirect(url))
  }

  if (claims && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return withCookies(NextResponse.redirect(url))
  }

  return withCookies(
    NextResponse.next({ request: { headers: requestHeaders } }),
  )
}
