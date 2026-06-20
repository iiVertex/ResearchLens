import { GraduationCap, Microscope, BookOpen, Briefcase } from "lucide-react"

const useCases = [
  {
    icon: GraduationCap,
    title: "Students",
    description:
      "Cut through dense assigned readings and grasp the core argument before class.",
  },
  {
    icon: Microscope,
    title: "Researchers",
    description:
      "Triage papers fast — pull methods, results, and limitations without a full read.",
  },
  {
    icon: BookOpen,
    title: "Literature reviews",
    description:
      "Interrogate a stack of papers one by one and capture cited quotes as you go.",
  },
  {
    icon: Briefcase,
    title: "Professionals",
    description:
      "Stay current with the science behind your field, answers grounded in the source.",
  },
]

export function UseCases() {
  return (
    <section className="border-y border-border bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Who it's for
          </p>
          <h2 className="mt-3 text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            Built for anyone who reads to learn
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((c) => (
            <div
              key={c.title}
              data-reveal
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-accent/40"
            >
              <c.icon className="size-6 text-accent" />
              <h3 className="mt-4 text-base font-medium text-card-foreground">
                {c.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {c.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
