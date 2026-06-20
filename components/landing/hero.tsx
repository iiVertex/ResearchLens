"use client"

import Link from "next/link"
import { ArrowRight, FileText, Sparkles, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ParticleField } from "@/components/landing/particle-field"

const stats = [
  { value: "100%", label: "answers cited" },
  { value: "30s", label: "to first question" },
  { value: "0", label: "hallucinated facts" },
]

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-36 md:pt-44">
      {/* Layered background: dotted grid + accent glow + particle cloud */}
      <div aria-hidden className="absolute inset-0 bg-grid" />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/3 -z-0 size-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[140px]"
      />
      <ParticleField />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <div
          data-anim="badge"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
        >
          <Sparkles className="size-3.5 text-accent" />
          Grounded answers from your own papers
        </div>

        <h1
          data-anim="headline"
          className="mt-6 text-balance font-sans text-[clamp(46px,8vw,82px)] font-light leading-[1.04] tracking-tight text-foreground"
        >
          Ask anything about{" "}
          <span className="text-gradient font-normal">your research.</span>
        </h1>

        <p
          data-anim="subheadline"
          className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
        >
          Upload a paper. Ask a question. Get a cited answer grounded in your
          document — with every claim linked to the exact page it came from. Not
          the internet. Not a guess.
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
            variant="outline"
            nativeButton={false}
            render={<a href="#how-it-works" />}
            className="h-11 px-5"
          >
            See how it works
          </Button>
        </div>

        <div
          data-anim="cta"
          className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"
        >
          <span className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-3.5 fill-accent text-accent" />
            ))}
          </span>
          Loved by researchers, students &amp; PhDs
        </div>

        <div data-anim="mockup" className="mt-14 w-full max-w-xl">
          <ChatMockup />
        </div>

        {/* Inline stat strip */}
        <dl
          data-anim="mockup"
          className="mt-12 grid w-full max-w-lg grid-cols-3 gap-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <dt className="text-2xl font-light text-foreground sm:text-3xl">
                {s.value}
              </dt>
              <dd className="mt-1 text-xs text-muted-foreground">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function ChatMockup() {
  return (
    <div className="glow-accent animate-float rounded-2xl border border-border bg-card/90 p-4 text-left backdrop-blur">
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
        <FileText className="size-4 text-accent" />
        <span className="font-mono text-xs text-muted-foreground">
          attention_is_all_you_need.pdf
        </span>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-medium text-accent">
          <span className="size-1.5 rounded-full bg-accent" />
          ready
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
