import { FileUp, MessageSquareText, Quote } from "lucide-react"

const features = [
  {
    icon: FileUp,
    title: "Upload any academic PDF",
    description: "Drag and drop your paper for instant processing.",
  },
  {
    icon: MessageSquareText,
    title: "Ask in plain language",
    description: "No search syntax needed — just ask like you would a colleague.",
  },
  {
    icon: Quote,
    title: "Cited answers",
    description: "Every answer links back to the exact passage it came from.",
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-28">
      <div className="grid gap-5 md:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            data-reveal
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10">
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
