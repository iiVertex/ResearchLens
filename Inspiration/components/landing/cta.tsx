"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <div
        data-reveal
        className="flex flex-col items-center rounded-xl border border-border bg-card px-6 py-20 text-center"
      >
        <h2 className="text-balance text-3xl font-light tracking-tight text-card-foreground sm:text-4xl">
          Start interrogating your papers.
        </h2>
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="/dashboard" />}
          className="mt-8 h-11 gap-2 bg-accent px-5 text-accent-foreground [a]:hover:bg-accent/90"
        >
          Get started for free
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  )
}
