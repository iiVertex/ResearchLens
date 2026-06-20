import type OpenAI from "openai"
import { embedOne } from "@/lib/ai"
import { createAdminClient } from "@/lib/supabase/admin"
import { extractCitations } from "@/lib/citations"

export { extractCitations }

export type RetrievedChunk = {
  id: string
  content: string
  page: number
  chunk_index: number
  similarity: number
}

const DEFAULT_TOP_K = 6

// pgvector-encoded literal: a vector(N) column is fed a string like "[0.1,0.2]".
function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`
}

// Embed the question and pull the top-k most similar chunks WITHIN one document.
export async function retrieve(
  documentId: string,
  question: string,
  k: number = DEFAULT_TOP_K,
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedOne(question)
  const admin = createAdminClient()

  const { data, error } = await admin.rpc("match_chunks", {
    p_document_id: documentId,
    p_query_embedding: toVectorLiteral(queryEmbedding),
    p_match_count: k,
  })
  if (error) throw new Error(`Retrieval failed: ${error.message}`)
  return (data ?? []) as RetrievedChunk[]
}

const SYSTEM_PROMPT = `You are ResearchLens, a careful research assistant. Answer the user's question USING ONLY the numbered context passages provided from a single academic paper.

Rules:
- Ground every claim in the passages. Do NOT use outside knowledge.
- If the answer is not contained in the passages, say so plainly (e.g. "The document doesn't appear to cover that.") and stop.
- Cite the page of each claim inline using the marker [p. N], taken from the page label on the passage you used. Cite every passage you rely on.
- Be concise and precise. Prefer the paper's own terminology.`

// Build the chat messages: system instruction + a user turn that embeds the
// retrieved passages (each labeled with its page) followed by the question.
export function buildPrompt(
  question: string,
  chunks: RetrievedChunk[],
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const context = chunks
    .map((c, i) => `[Passage ${i + 1} | p. ${c.page}]\n${c.content}`)
    .join("\n\n---\n\n")

  const userContent = `Context passages:\n\n${context}\n\n----\n\nQuestion: ${question}`

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ]
}
