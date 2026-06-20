import { Upload, MessageCircleQuestion, BadgeCheck } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload your paper",
    description:
      "Drop in any PDF. We extract the text page by page and index it for semantic search.",
  },
  {
    number: "02",
    icon: MessageCircleQuestion,
    title: "Ask your question",
    description:
      "Type a question in plain English. The most relevant passages are retrieved instantly.",
  },
  {
    number: "03",
    icon: BadgeCheck,
    title: "Get a cited answer",
    description:
      "Read a concise answer with inline citations you can click to verify against the source.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-28">
      <div data-reveal className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-light tracking-tight text-foreground sm:text-4xl">
          From PDF to cited answer in three steps
        </h2>
      </div>

      <div className="relative mt-16">
        {/* Connecting line (desktop) */}
        <div
          aria-hidden
          className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
        />
        <div className="relative grid gap-12 md:grid-cols-3 md:gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              data-reveal
              className="flex flex-col items-center text-center"
            >
              <div className="relative flex size-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                <step.icon className="size-6 text-accent" />
                <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-semibold text-accent-foreground">
                  {step.number}
                </span>
              </div>
              <h3 className="mt-5 text-base font-medium text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
