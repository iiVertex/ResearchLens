// Pure citation helpers — safe to import in both client and server code
// (no server-only dependencies).

export type Citation = { page: number }

// A retrieved source passage, persisted with each assistant answer so the UI can
// open the PDF to a citation's page and highlight the passage text on that page.
export type Source = { page: number; chunk_index: number; content: string }

// Marks the boundary in the chat stream between the answer text and a trailing
// JSON metadata blob (the retrieved source passages). A NUL byte never appears
// in model output, so it can't collide with the answer.
export const SOURCES_SENTINEL = String.fromCharCode(0)

const CITATION_RE = /\[p\.\s*(\d+)\]/gi

// Distinct cited pages in order of first appearance.
export function extractCitations(text: string): Citation[] {
  const seen = new Set<number>()
  const out: Citation[] = []
  let m: RegExpExecArray | null
  CITATION_RE.lastIndex = 0
  while ((m = CITATION_RE.exec(text)) !== null) {
    const page = Number(m[1])
    if (!seen.has(page)) {
      seen.add(page)
      out.push({ page })
    }
  }
  return out
}

// Remove inline [p. N] markers from prose for clean display (the pages are
// surfaced separately as citation chips).
export function stripCitations(text: string): string {
  return text.replace(/\s*\[p\.\s*\d+\]/gi, "").replace(/[ \t]{2,}/g, " ")
}
