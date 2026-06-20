import { Plus } from "lucide-react"

const faqs = [
  {
    q: "How does ResearchLens avoid making things up?",
    a: "Answers are generated only from passages retrieved out of your uploaded PDF. If the paper doesn't cover something, ResearchLens tells you instead of guessing — and every claim carries a citation you can click to verify.",
  },
  {
    q: "What kind of PDFs can I upload?",
    a: "Any text-based academic PDF up to 30 MB — journal articles, preprints, theses, lecture notes. Scanned image-only PDFs without selectable text aren't supported yet.",
  },
  {
    q: "Are my documents private?",
    a: "Yes. Your papers and conversations are tied to your account and protected by row-level security, so only you can access them.",
  },
  {
    q: "Do the citations really link to the source?",
    a: "Each [p. N] marker opens the PDF to that page in a side panel with the cited passage highlighted, so you can confirm the answer against the original text in one click.",
  },
  {
    q: "Is it free to start?",
    a: "You can sign up and upload your first papers for free — no credit card required to try it out.",
  },
]

export function FAQ() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-28">
      <div data-reveal className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          FAQ
        </p>
        <h2 className="mt-3 text-3xl font-light tracking-tight text-foreground sm:text-4xl">
          Questions, answered
        </h2>
      </div>

      <div className="mt-12 flex flex-col gap-3">
        {faqs.map((item) => (
          <details
            key={item.q}
            data-reveal
            className="group rounded-2xl border border-border bg-card px-5 open:border-accent/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-medium text-card-foreground [&::-webkit-details-marker]:hidden">
              {item.q}
              <Plus className="size-4 shrink-0 text-accent transition-transform duration-200 group-open:rotate-45" />
            </summary>
            <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
