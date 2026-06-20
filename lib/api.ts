// Client-side fetch helpers for the dashboard. Thin typed wrappers over the
// /api routes. Keep UI components free of fetch boilerplate.

import type { Citation, Source } from "@/lib/citations"

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
// id (new or existing) and the full answer text once the stream ends.
export async function streamChat(
  args: { documentId: string; conversationId?: string; question: string },
  onToken: (delta: string) => void,
): Promise<{ conversationId: string; answer: string }> {
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
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    const text = decoder.decode(value, { stream: true })
    answer += text
    onToken(text)
  }
  return { conversationId, answer }
}
