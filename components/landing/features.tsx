import {
  FileUp,
  MessageSquareText,
  Quote,
  ShieldCheck,
  ScanText,
  History,
} from "lucide-react"

const features = [
  {
    icon: FileUp,
    title: "Upload any academic PDF",
    description:
      "Drag and drop your paper — it's parsed, split, and indexed in seconds, ready to query.",
  },
  {
    icon: MessageSquareText,
    title: "Ask in plain language",
    description:
      "No search syntax, no keywords. Ask like you would a knowledgeable colleague.",
  },
  {
    icon: Quote,
    title: "Every answer is cited",
    description:
      "Each claim links to the exact passage — click it to jump straight to the page.",
  },
  {
    icon: ScanText,
    title: "Side-by-side PDF viewer",
    description:
      "Open the source PDF inline with the cited passage highlighted right where it lives.",
  },
  {
    icon: ShieldCheck,
    title: "Grounded, never guessed",
    description:
      "Answers come only from your document. If it's not in the paper, ResearchLens says so.",
  },
  {
    icon: History,
    title: "Conversations that persist",
    description:
      "Every chat is saved per paper, so you can pick up your line of questioning any time.",
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-28">
      <div data-reveal className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Features
        </p>
        <h2 className="mt-3 text-balance text-3xl font-light tracking-tight text-foreground sm:text-4xl">
          Everything you need to read smarter
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          Purpose-built for interrogating dense academic papers — fast, precise,
          and always traceable back to the source.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            data-reveal
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
          >
            <div
              aria-hidden
              className="absolute -right-10 -top-10 size-28 rounded-full bg-accent/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100"
            />
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/20">
              <feature.icon className="size-5 text-accent" />
            </div>
            <h3 className="mt-5 text-base font-medium text-card-foreground">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
