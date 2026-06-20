"use client"

import {
  ArrowUp,
  Eraser,
  FileText,
  Paperclip,
  PanelLeft,
  Sparkles,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  suggestedQuestions,
  type ChatMessage,
} from "@/lib/dashboard-data"

type ChatAreaProps = {
  activeDocName: string
  messages: ChatMessage[]
  isThinking: boolean
  sidebarCollapsed: boolean
  onSend: (text: string) => void
  onClear: () => void
  onOpenSidebar: () => void
}

export function ChatArea({
  activeDocName,
  messages,
  isThinking,
  sidebarCollapsed,
  onSend,
  onClear,
  onOpenSidebar,
}: ChatAreaProps) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isThinking])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    onSend(trimmed)
    setInput("")
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          {sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open sidebar"
              onClick={onOpenSidebar}
            >
              <PanelLeft className="size-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <span className="max-w-[60vw] truncate font-mono text-sm text-foreground">
            {activeDocName}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Clear chat"
          onClick={onClear}
        >
          <Eraser className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          {isEmpty ? (
            <EmptyState docName={activeDocName} onPick={onSend} />
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {isThinking && <ThinkingBubble />}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-4">
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
          <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-2 py-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Attach file"
            >
              <Paperclip className="size-4 text-muted-foreground" />
            </Button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this paper..."
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              size="icon-sm"
              aria-label="Send message"
              disabled={!input.trim()}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <ArrowUp className="size-4" />
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

function EmptyState({
  docName,
  onPick,
}: {
  docName: string
  onPick: (text: string) => void
}) {
  return (
    <div className="flex flex-col items-center pt-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10">
        <Sparkles className="size-6 text-accent" />
      </div>
      <h2 className="mt-5 text-lg font-medium text-foreground">
        Ask anything about{" "}
        <span className="font-mono text-base">{docName}</span>
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

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-xl rounded-br-sm bg-accent px-4 py-2.5 text-sm leading-relaxed text-accent-foreground">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] rounded-xl rounded-bl-sm bg-secondary px-4 py-3 text-sm leading-relaxed text-foreground">
        {message.content}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {message.citations.map((c) => (
              <button
                key={c.page}
                className="rounded-md bg-accent/10 px-2 py-0.5 font-mono text-xs font-medium text-accent transition-colors hover:bg-accent/20"
              >
                [p. {c.page}]
              </button>
            ))}
          </div>
        )}
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
