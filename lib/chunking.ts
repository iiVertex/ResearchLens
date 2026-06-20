import { extractText, getDocumentProxy } from "unpdf"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"

export type PdfChunk = {
  content: string
  page: number // 1-based source page, used for [p. N] citations
  chunk_index: number // global order across the document
}

export type ParsedPdf = {
  numPages: number
  chunks: PdfChunk[]
}

// Character-based sizes (the splitter counts characters, not tokens).
// ~3000 chars ≈ ~750 tokens — a comfortable chunk for retrieval, with overlap
// so a claim split across a boundary still lands wholly inside some chunk.
const CHUNK_SIZE = 3000
const CHUNK_OVERLAP = 300

// Parse a PDF buffer into page-aware chunks. We extract text per page (so every
// chunk keeps its source page for citations), then split each page's text.
export async function parsePdf(data: ArrayBuffer | Uint8Array): Promise<ParsedPdf> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const pdf = await getDocumentProxy(bytes)

  // mergePages: false → `text` is an array of strings, one entry per page.
  const { totalPages, text } = await extractText(pdf, { mergePages: false })
  const pages = Array.isArray(text) ? text : [text]

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  })

  const chunks: PdfChunk[] = []
  let chunkIndex = 0

  for (let i = 0; i < pages.length; i++) {
    const pageText = (pages[i] ?? "").replace(/\s+\n/g, "\n").trim()
    if (!pageText) continue

    const pieces = await splitter.splitText(pageText)
    for (const piece of pieces) {
      const content = piece.trim()
      if (!content) continue
      chunks.push({ content, page: i + 1, chunk_index: chunkIndex++ })
    }
  }

  return { numPages: totalPages ?? pages.length, chunks }
}
