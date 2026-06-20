"use client"

import { Fragment, type ReactNode } from "react"

// Lightweight Markdown renderer for assistant answers. Handles the subset the
// model actually emits — headings, bullet/numbered lists, bold/italic/inline
// code — plus inline `[p. N]` citation markers, which are rendered in place as
// clickable buttons (via `renderCitation`) instead of being stripped to chips.
//
// Deliberately dependency-free: a focused parser beats pulling a full Markdown
// stack into the client bundle for a handful of inline features.

type Props = {
  text: string
  // Renders one inline citation for a cited page. Returns null to drop it.
  renderCitation: (page: number, key: string) => ReactNode
}

const CITATION = /\[p\.\s*(\d+)\]/
// One regex matching every inline token we support, in priority order.
const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`]+`|\[p\.\s*\d+\])/g

function parseInline(
  text: string,
  keyPrefix: string,
  renderCitation: Props["renderCitation"],
): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of text.matchAll(INLINE)) {
    const token = m[0]
    const start = m.index ?? 0
    if (start > last) out.push(text.slice(last, start))
    const key = `${keyPrefix}-${i++}`

    const cite = token.match(CITATION)
    if (cite) {
      out.push(renderCitation(Number(cite[1]), key))
    } else if (token.startsWith("**") || token.startsWith("__")) {
      out.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith("`")) {
      out.push(
        <code
          key={key}
          className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>,
      )
    } else {
      out.push(<em key={key}>{token.slice(1, -1)}</em>)
    }
    last = start + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

type Block =
  | { type: "h"; level: number; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }

function toBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n")
  const blocks: Block[] = []
  let para: string[] = []

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "p", text: para.join(" ") })
      para = []
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line)
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line)

    if (line.trim() === "") {
      flushPara()
    } else if (heading) {
      flushPara()
      blocks.push({ type: "h", level: heading[1].length, text: heading[2] })
    } else if (bullet) {
      flushPara()
      const prev = blocks[blocks.length - 1]
      if (prev?.type === "ul") prev.items.push(bullet[1])
      else blocks.push({ type: "ul", items: [bullet[1]] })
    } else if (numbered) {
      flushPara()
      const prev = blocks[blocks.length - 1]
      if (prev?.type === "ol") prev.items.push(numbered[1])
      else blocks.push({ type: "ol", items: [numbered[1]] })
    } else {
      para.push(line.trim())
    }
  }
  flushPara()
  return blocks
}

export function RichText({ text, renderCitation }: Props) {
  const blocks = toBlocks(text)

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((b, bi) => {
        const k = `b${bi}`
        if (b.type === "h") {
          const cls =
            b.level === 1
              ? "text-base font-semibold"
              : b.level === 2
                ? "text-sm font-semibold"
                : "text-sm font-medium"
          return (
            <p key={k} className={cls}>
              {parseInline(b.text, k, renderCitation)}
            </p>
          )
        }
        if (b.type === "ul" || b.type === "ol") {
          const ListTag = b.type === "ul" ? "ul" : "ol"
          return (
            <ListTag
              key={k}
              className={
                b.type === "ul"
                  ? "list-disc space-y-1 pl-5"
                  : "list-decimal space-y-1 pl-5"
              }
            >
              {b.items.map((item, ii) => (
                <li key={`${k}-${ii}`}>
                  {parseInline(item, `${k}-${ii}`, renderCitation)}
                </li>
              ))}
            </ListTag>
          )
        }
        return (
          <p key={k} className="whitespace-pre-wrap">
            <Fragment>{parseInline(b.text, k, renderCitation)}</Fragment>
          </p>
        )
      })}
    </div>
  )
}
