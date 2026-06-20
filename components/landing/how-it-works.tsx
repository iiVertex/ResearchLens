const steps = [
  { number: "1", title: "Upload your paper" },
  { number: "2", title: "Ask your question" },
  { number: "3", title: "Get a cited answer" },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-6xl px-6 py-28"
    >
      <h2
        data-reveal
        className="text-center text-3xl font-light tracking-tight text-foreground"
      >
        How it works
      </h2>

      <div className="relative mt-16">
        {/* Thin connecting line (desktop) */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-5 hidden h-px bg-border md:block"
        />
        <div className="relative grid gap-12 md:grid-cols-3 md:gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              data-reveal
              className="flex flex-col items-center text-center"
            >
              <div className="flex size-10 items-center justify-center rounded-full border border-border bg-background font-mono text-sm text-foreground">
                {step.number}
              </div>
              <p className="mt-4 text-base font-medium text-foreground">
                {step.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
