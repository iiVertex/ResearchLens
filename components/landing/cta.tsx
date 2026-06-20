"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <div
        data-reveal
        className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-20 text-center"
      >
        {/* Glow accents */}
        <div
          aria-hidden
          className="absolute -left-20 -top-20 size-72 rounded-full bg-accent/20 blur-[120px]"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -right-16 size-72 rounded-full bg-accent/10 blur-[120px]"
        />

        <div className="relative">
          <h2 className="text-balance text-3xl font-light tracking-tight text-card-foreground sm:text-4xl md:text-5xl">
            Start interrogating{" "}
            <span className="text-gradient font-normal">your papers.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-pretty text-muted-foreground">
            Upload your first PDF and get a cited answer in under a minute. No
            credit card required.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/signup" />}
              className="h-11 gap-2 bg-accent px-5 text-accent-foreground [a]:hover:bg-accent/90"
            >
              Get started for free
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/login" />}
              className="h-11 px-5"
            >
              Sign in
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
