"use client"

import {
  AlertCircle,
  ArrowUp,
  FileText,
  Loader2,
  PanelLeft,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { suggestedQuestions, type ChatMessage } from "@/lib/dashboard-data"
import { RichText } from "@/components/dashboard/rich-text"
import type { DocumentItem } from "@/lib/api"

type ChatAreaProps = {
  activeDoc: DocumentItem | null
  messages: ChatMessage[]
  isThinking: boolean
  error: string | null
  sidebarCollapsed: boolean
  onSend: (text: string) => void
  onNewChat: () => void
  onOpenSidebar: () => void
  // Open the PDF panel to a cited page, highlighting the cited passage text.
  onCitationClick: (page: number, highlights: string[]) => void
}

export function ChatArea({
  activeDoc,
  messages,
  isThinking,
  error,
  sidebarCollapsed,
  onSend,
  onNewChat,
  onOpenSidebar,
  onCitationClick,
}: ChatAreaProps) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isThinking])

  const ready = activeDoc?.status === "ready"
  const canSend = ready && !isThinking

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || !canSend) return
    onSend(trimmed)
    setInput("")
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex w-10 items-center">
          {sidebarCollapsed && (
            <Button variant="ghost" size="icon-sm" aria-label="Open sidebar" onClick={onOpenSidebar}>
              <PanelLeft className="size-4" />
            </Button>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <span className="max-w-[60vw] truncate font-mono text-sm text-foreground">
            {activeDoc?.name ?? "No document selected"}
          </span>
        </div>
        <div className="flex w-10 justify-end">
          <Button variant="ghost" size="icon-sm" aria-label="New chat" onClick={onNewChat}>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          {!activeDoc ? (
            <NoDocumentState />
          ) : activeDoc.status === "processing" ? (
            <ProcessingState name={activeDoc.name} />
          ) : activeDoc.status === "error" ? (
            <ErrorState message={activeDoc.error} />
          ) : isEmpty ? (
            <EmptyState docName={activeDoc.name} onPick={onSend} />
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  streaming={isThinking}
                  onCitationClick={onCitationClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-4">
        {error && (
          <p className="mx-auto mb-2 flex max-w-3xl items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="size-3.5" />
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
          <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-2 py-1.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!canSend}
              placeholder={
                ready ? "Ask a question about this paper..." : "Upload or select a ready paper to ask…"
              }
              className="flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />
            <Button
              type="submit"
              size="icon-sm"
              aria-label="Send message"
              disabled={!input.trim() || !canSend}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isThinking ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            ResearchLens answers from your document only
          </p>
        </form>
      </div>
    </div>
  )
}

function EmptyState({ docName, onPick }: { docName: string; onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center pt-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10">
        <Sparkles className="size-6 text-accent" />
      </div>
      <h2 className="mt-5 text-lg font-medium text-foreground">
        Ask anything about <span className="font-mono text-base">{docName}</span>
      </h2>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {suggestedQuestions.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

function NoDocumentState() {
  return (
    <div className="flex flex-col items-center pt-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-secondary">
        <Upload className="size-6 text-muted-foreground" />
      </div>
      <h2 className="mt-5 text-lg font-medium text-foreground">No paper selected</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Upload a PDF from the sidebar to start asking questions grounded in your document.
      </p>
    </div>
  )
}

function ProcessingState({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center pt-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10">
        <Loader2 className="size-6 animate-spin text-accent" />
      </div>
      <h2 className="mt-5 text-lg font-medium text-foreground">Processing your paper…</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        We're reading, splitting, and indexing{" "}
        <span className="font-mono">{name}</span>. This usually takes a few seconds.
      </p>
    </div>
  )
}

function ErrorState({ message }: { message: string | null }) {
  return (
    <div className="flex flex-col items-center pt-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
        <AlertCircle className="size-6 text-destructive" />
      </div>
      <h2 className="mt-5 text-lg font-medium text-foreground">Couldn't process this paper</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {message ?? "Something went wrong while indexing this PDF."}
      </p>
    </div>
  )
}

function MessageBubble({
  message,
  streaming,
  onCitationClick,
}: {
  message: ChatMessage
  streaming: boolean
  onCitationClick: (page: number, highlights: string[]) => void
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-xl rounded-br-sm bg-accent px-4 py-2.5 text-sm leading-relaxed text-accent-foreground">
          {message.content}
        </div>
      </div>
    )
  }

  // Assistant: an empty streaming bubble shows the typing indicator.
  if (!message.content) {
    return streaming ? <ThinkingBubble /> : null
  }

  // Inline citation: opens the PDF to the cited page, highlighting that page's
  // source passages. Rendered in place where `[p. N]` appears in the prose.
  const renderCitation = (page: number, key: string) => {
    const highlights = (message.sources ?? [])
      .filter((s) => s.page === page)
      .map((s) => s.content)
    return (
      <button
        key={key}
        type="button"
        onClick={() => onCitationClick(page, highlights)}
        title={`Open page ${page} of the source PDF`}
        className="mx-0.5 cursor-pointer rounded-md bg-accent/10 px-1.5 py-0.5 align-baseline font-mono text-xs font-medium text-accent transition-colors hover:bg-accent/20"
      >
        [p. {page}]
      </button>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] rounded-xl rounded-bl-sm bg-secondary px-4 py-3 text-sm leading-relaxed text-foreground">
        <RichText text={message.content} renderCitation={renderCitation} />
      </div>
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-xl rounded-bl-sm bg-secondary px-4 py-3.5">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </div>
    </div>
  )
}
