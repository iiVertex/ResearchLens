"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ScanSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

type Mode = "login" | "signup"

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams.get("redirectedFrom") ?? "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignup = mode === "signup"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)
    const supabase = createClient()

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        // If email confirmation is enabled, there's no active session yet.
        if (data.session) {
          router.replace(redirectedFrom)
          router.refresh()
        } else {
          setNotice("Check your email to confirm your account, then sign in.")
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.replace(redirectedFrom)
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-foreground"
        >
          <ScanSearch className="size-5 text-accent" />
          <span className="font-mono text-sm font-medium tracking-tight">
            ResearchLens
          </span>
        </Link>

        <h1 className="text-center text-2xl font-light tracking-tight text-foreground">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {isSignup
            ? "Start asking questions about your papers."
            : "Sign in to continue to your documents."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          <Input
            type="email"
            required
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10"
          />
          <Input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10"
          />

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="text-sm text-accent" role="status">
              {notice}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="mt-1 h-10 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {loading
              ? "Please wait…"
              : isSignup
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account? " : "New to ResearchLens? "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="text-accent hover:underline"
          >
            {isSignup ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>
    </div>
  )
}
