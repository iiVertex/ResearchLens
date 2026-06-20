"use client"

import Link from "next/link"
import { ScanSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  return (
    <header
      data-anim="navbar"
      className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-sm"
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <ScanSearch className="size-5 text-accent" />
          <span className="font-mono text-sm font-medium tracking-tight text-foreground">
            ResearchLens
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </a>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            nativeButton={false}
            render={<Link href="/signup" />}
            className="bg-accent text-accent-foreground [a]:hover:bg-accent/90"
          >
            Get started
          </Button>
        </div>
      </nav>
    </header>
  )
}
