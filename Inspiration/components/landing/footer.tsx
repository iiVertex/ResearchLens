import { ScanSearch } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <ScanSearch className="size-4 text-accent" />
          <span className="font-mono text-sm text-foreground">ResearchLens</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#" className="transition-colors hover:text-foreground">
            GitHub
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Built with Supabase
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Built with OpenAI
          </a>
        </div>
      </div>
    </footer>
  )
}
