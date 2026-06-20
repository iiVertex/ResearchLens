// Client-side fetch helpers for the dashboard. Thin typed wrappers over the
// /api routes. Keep UI components free of fetch boilerplate.

import { SOURCES_SENTINEL, type Citation, type Source } from "@/lib/citations"

export type { Source }

export type DocStatus = "processing" | "ready" | "error"

export type DocumentItem = {
  id: string
  name: string
  status: DocStatus
  num_pages: number | null
  error: string | null
  created_at: string
}

export type ConversationItem = {
  id: string
  document_id: string
  title: string
  created_at: string
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: Citation[]
  // Retrieved passages backing an assistant answer; used to highlight the cited
  // text in the PDF panel. Absent on older messages (falls back to page-jump).
  sources?: Source[] | null
}

async function json<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText)
  return data as T
}

export async function listDocuments(): Promise<DocumentItem[]> {
  return (await json<{ documents: DocumentItem[] }>(await fetch("/api/documents")))
    .documents
}

// Upload, then trigger processing. Returns the final (ready/error) document.
export async function uploadAndProcess(
  file: File,
  onStatus?: (doc: DocumentItem) => void,
): Promise<DocumentItem> {
  const form = new FormData()
  form.append("file", file)
  const created = await json<{ document: DocumentItem }>(
    await fetch("/api/documents", { method: "POST", body: form }),
  )
  onStatus?.(created.document) // status: processing

  const processed = await json<{ document: DocumentItem }>(
    await fetch(`/api/documents/${created.document.id}/process`, { method: "POST" }),
  )
  return processed.document
}

export async function deleteDocument(id: string): Promise<void> {
  await json(await fetch(`/api/documents/${id}`, { method: "DELETE" }))
}

// Mint a short-lived signed URL for the document's PDF (private storage bucket).
export async function getPdfUrl(id: string): Promise<string> {
  return (await json<{ url: string }>(await fetch(`/api/documents/${id}/pdf-url`)))
    .url
}

export async function listConversations(documentId: string): Promise<ConversationItem[]> {
  const res = await fetch(`/api/conversations?documentId=${documentId}`)
  return (await json<{ conversations: ConversationItem[] }>(res)).conversations
}

export async function getConversation(
  id: string,
): Promise<{ conversation: ConversationItem; messages: ChatMessage[] }> {
  return json(await fetch(`/api/conversations/${id}`))
}

// Stream an answer. Calls onToken for each delta; resolves with the conversation
// id, the full answer text, and the retrieved source passages (sent after a NUL
// sentinel at the end of the stream) so the UI can highlight cited text right
// away — without waiting for a reload.
export async function streamChat(
  args: { documentId: string; conversationId?: string; question: string },
  onToken: (delta: string) => void,
): Promise<{ conversationId: string; answer: string; sources: Source[] }> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  })
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? "Chat failed")
  }

  const conversationId = res.headers.get("x-conversation-id") ?? args.conversationId ?? ""
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let answer = ""
  let meta: string | null = null // everything after the NUL sentinel
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    const text = decoder.decode(value, { stream: true })
    if (meta !== null) {
      meta += text
      continue
    }
    const idx = text.indexOf(SOURCES_SENTINEL)
    if (idx === -1) {
      answer += text
      onToken(text)
    } else {
      const head = text.slice(0, idx)
      if (head) {
        answer += head
        onToken(head)
      }
      meta = text.slice(idx + SOURCES_SENTINEL.length)
    }
  }

  let sources: Source[] = []
  if (meta) {
    try {
      sources = (JSON.parse(meta) as { sources?: Source[] }).sources ?? []
    } catch {
      /* malformed trailer — fall back to no live highlights */
    }
  }
  return { conversationId, answer, sources }
}
