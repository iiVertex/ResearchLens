import { NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { streamAnswer } from "@/lib/ai"
import { retrieve, buildPrompt } from "@/lib/rag"
import { extractCitations } from "@/lib/citations"

const bodySchema = z.object({
  documentId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  question: z.string().trim().min(1).max(2000),
})

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
  const { documentId, question } = parsed.data
  let conversationId = parsed.data.conversationId

  const supabase = await createClient()

  // Verify the document is owned by the caller and finished processing.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, status")
    .eq("id", documentId)
    .single()
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })
  if (doc.status !== "ready") {
    return NextResponse.json({ error: "Document is still processing" }, { status: 409 })
  }

  // Start (or continue) a conversation.
  if (conversationId) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .single()
    if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  } else {
    const title = question.length > 80 ? `${question.slice(0, 77)}…` : question
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, document_id: documentId, title })
      .select("id")
      .single()
    if (error || !conv) {
      return NextResponse.json({ error: "Could not start conversation" }, { status: 500 })
    }
    conversationId = conv.id
  }

  // Persist the user's question.
  await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role: "user", content: question })

  // Retrieve grounding passages and ask the model.
  let completion
  // Captured for persistence so the UI can highlight cited passages in the PDF.
  let sources: { page: number; chunk_index: number; content: string }[] = []
  try {
    const chunks = await retrieve(documentId, question)
    sources = chunks.map((c) => ({
      page: c.page,
      chunk_index: c.chunk_index,
      content: c.content,
    }))
    const messages = buildPrompt(question, chunks)
    completion = await streamAnswer(messages)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }

  const convId: string = conversationId!
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = ""
      try {
        for await (const part of completion) {
          const delta = part.choices[0]?.delta?.content ?? ""
          if (delta) {
            full += delta
            controller.enqueue(encoder.encode(delta))
          }
        }
      } catch {
        // Stream interrupted — persist whatever we have so far.
      } finally {
        controller.close()
        // Persist the assistant's answer + parsed citations + the source passages
        // (so the UI can open the PDF and highlight the cited text) after the response.
        await supabase.from("messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: full,
          citations: extractCitations(full),
          sources,
        })
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "x-conversation-id": convId,
    },
  })
}
