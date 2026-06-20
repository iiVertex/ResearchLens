"use client"

import Link from "next/link"
import { ArrowRight, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ParticleField } from "@/components/landing/particle-field"

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-40 md:pt-48">
      <ParticleField />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <h1
          data-anim="headline"
          className="text-balance font-sans text-[clamp(48px,8vw,80px)] font-light leading-[1.05] tracking-tight text-foreground"
        >
          Ask anything about your research.
        </h1>

        <p
          data-anim="subheadline"
          className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
        >
          Upload a paper. Ask a question. Get a cited answer grounded in your
          document — not the internet.
        </p>

        <div
          data-anim="cta"
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/dashboard" />}
            className="h-11 gap-2 bg-accent px-5 text-accent-foreground [a]:hover:bg-accent/90"
          >
            Upload a paper
            <ArrowRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            nativeButton={false}
            render={<a href="#how-it-works" />}
            className="h-11 px-5"
          >
            See how it works
          </Button>
        </div>

        <div data-anim="mockup" className="mt-16 w-full max-w-xl">
          <ChatMockup />
        </div>
      </div>
    </section>
  )
}

function ChatMockup() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-left shadow-sm">
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
        <FileText className="size-4 text-muted-foreground" />
        <span className="font-mono text-xs text-muted-foreground">
          attention_is_all_you_need.pdf
        </span>
      </div>

      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-xl rounded-br-sm bg-accent px-3.5 py-2 text-sm text-accent-foreground">
          What problem does this paper solve?
        </div>
      </div>

      <div className="mt-3 flex justify-start">
        <div className="max-w-[88%] rounded-xl rounded-bl-sm bg-secondary px-3.5 py-2 text-sm leading-relaxed text-foreground">
          It replaces recurrence and convolutions with a pure attention
          mechanism, enabling far more parallelization and faster training while
          improving translation quality.
          <div className="mt-2 flex gap-1.5">
            <span className="rounded-md bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-accent">
              [p. 2]
            </span>
            <span className="rounded-md bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-accent">
              [p. 4]
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
