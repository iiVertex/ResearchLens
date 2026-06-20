"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ChatArea } from "@/components/dashboard/chat-area"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  deleteDocument,
  getConversation,
  listConversations,
  listDocuments,
  streamChat,
  uploadAndProcess,
  type ChatMessage,
  type ConversationItem,
  type DocumentItem,
} from "@/lib/api"

// pdf.js must never run on the server — load the viewer client-side only.
const PdfPanel = dynamic(
  () => import("@/components/dashboard/pdf-panel").then((m) => m.PdfPanel),
  { ssr: false },
)

type PdfState = {
  docId: string
  docName: string
  page: number
}

const PDF_MIN_WIDTH = 360
const PDF_MAX_WIDTH = 820
const PDF_DEFAULT_WIDTH = 520

type Props = {
  userEmail: string
  initialDocuments: DocumentItem[]
}

export function DashboardClient({ userEmail, initialDocuments }: Props) {
  const router = useRouter()

  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments)
  const [activeDocId, setActiveDocId] = useState<string | null>(
    initialDocuments[0]?.id ?? null,
  )
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const [isStreaming, setIsStreaming] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Citation PDF viewer (right panel).
  const [pdf, setPdf] = useState<PdfState | null>(null)
  const [pdfWidth, setPdfWidth] = useState(PDF_DEFAULT_WIDTH)

  const activeDoc = documents.find((d) => d.id === activeDocId) ?? null

  const openCitation = useCallback(
    (page: number) => {
      if (!activeDoc) return
      setPdf({ docId: activeDoc.id, docName: activeDoc.name, page })
    },
    [activeDoc],
  )

  // Drag the divider between chat and PDF to resize the panel.
  const startResize = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const onMove = (ev: PointerEvent) => {
      const fromRight = window.innerWidth - ev.clientX
      setPdfWidth(Math.min(PDF_MAX_WIDTH, Math.max(PDF_MIN_WIDTH, fromRight)))
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [])

  // Load conversation list whenever the active document changes.
  useEffect(() => {
    if (!activeDocId) {
      setConversations([])
      return
    }
    let cancelled = false
    listConversations(activeDocId)
      .then((convs) => !cancelled && setConversations(convs))
      .catch(() => !cancelled && setConversations([]))
    return () => {
      cancelled = true
    }
  }, [activeDocId])

  // Poll document statuses while anything is still processing.
  const hasProcessing = documents.some((d) => d.status === "processing")
  useEffect(() => {
    if (!hasProcessing) return
    const interval = setInterval(async () => {
      try {
        setDocuments(await listDocuments())
      } catch {
        /* keep last known state */
      }
    }, 2500)
    return () => clearInterval(interval)
  }, [hasProcessing])

  const closeOnMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) setSidebarOpen(false)
  }

  const handleSelectDoc = useCallback((docId: string) => {
    setActiveDocId(docId)
    setActiveConversationId(null)
    setMessages([])
    setError(null)
    setPdf(null)
    closeOnMobile()
  }, [])

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null)
    setMessages([])
    setError(null)
  }, [])

  const handleSelectConversation = useCallback(async (convId: string) => {
    setError(null)
    try {
      const { conversation, messages } = await getConversation(convId)
      setActiveDocId(conversation.document_id)
      setActiveConversationId(convId)
      setMessages(messages)
      setPdf(null)
      closeOnMobile()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load conversation")
    }
  }, [])

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const finalDoc = await uploadAndProcess(file, (processingDoc) => {
        // Optimistically show the processing document and switch to it.
        setDocuments((prev) => [processingDoc, ...prev])
        setActiveDocId(processingDoc.id)
        setActiveConversationId(null)
        setMessages([])
      })
      setDocuments((prev) =>
        prev.map((d) => (d.id === finalDoc.id ? finalDoc : d)),
      )
      if (finalDoc.status === "error") {
        setError(finalDoc.error ?? "Could not process this PDF.")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }, [])

  const handleDeleteDoc = useCallback(
    async (docId: string) => {
      try {
        await deleteDocument(docId)
        setDocuments((prev) => prev.filter((d) => d.id !== docId))
        setPdf((p) => (p?.docId === docId ? null : p))
        if (activeDocId === docId) {
          setActiveDocId(null)
          setActiveConversationId(null)
          setMessages([])
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete document")
      }
    },
    [activeDocId],
  )

  const streamingIdRef = useRef(0)

  const handleSend = useCallback(
    async (text: string) => {
      if (!activeDoc || activeDoc.status !== "ready" || isStreaming) return
      setError(null)

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
      }
      const assistantId = `a-${++streamingIdRef.current}`
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
      }
      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsStreaming(true)

      try {
        const { conversationId } = await streamChat(
          {
            documentId: activeDoc.id,
            conversationId: activeConversationId ?? undefined,
            question: text,
          },
          (delta) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + delta } : m,
              ),
            )
          },
        )

        const isNewConversation = !activeConversationId
        if (isNewConversation && conversationId) {
          setActiveConversationId(conversationId)
          // Refresh the sidebar history so the new conversation appears.
          listConversations(activeDoc.id).then(setConversations).catch(() => {})
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Something went wrong."
        setError(message)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content || `⚠️ ${message}` }
              : m,
          ),
        )
      } finally {
        setIsStreaming(false)
      }
    },
    [activeDoc, activeConversationId, isStreaming],
  )

  const handleSignOut = useCallback(async () => {
    await createClient().auth.signOut()
    router.replace("/")
    router.refresh()
  }, [router])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-foreground/20 md:hidden"
        />
      )}

      <aside
        className={cn(
          "z-40 h-full shrink-0 border-r border-sidebar-border transition-[margin] duration-300 ease-out",
          "max-md:fixed max-md:inset-y-0 max-md:left-0",
          sidebarOpen ? "ml-0" : "-ml-[260px] max-md:-translate-x-full max-md:ml-0",
        )}
      >
        <Sidebar
          userEmail={userEmail}
          documents={documents}
          activeDocId={activeDocId}
          conversations={conversations}
          activeConversationId={activeConversationId}
          uploading={uploading}
          onSelectDoc={handleSelectDoc}
          onSelectConversation={handleSelectConversation}
          onDeleteDoc={handleDeleteDoc}
          onUpload={handleUpload}
          onNewChat={handleNewChat}
          onSignOut={handleSignOut}
          onToggle={() => setSidebarOpen(false)}
        />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <ChatArea
          activeDoc={activeDoc}
          messages={messages}
          isThinking={isStreaming}
          error={error}
          sidebarCollapsed={!sidebarOpen}
          onSend={handleSend}
          onNewChat={handleNewChat}
          onOpenSidebar={() => setSidebarOpen(true)}
          onCitationClick={openCitation}
        />
      </main>

      {/* Citation PDF viewer — resizable on desktop, full overlay on mobile */}
      {pdf && (
        <>
          <div
            role="separator"
            aria-orientation="vertical"
            onPointerDown={startResize}
            className="hidden w-1 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-accent md:block"
          />
          <aside
            style={{ width: pdfWidth }}
            className="z-40 h-full shrink-0 border-l border-border max-md:fixed max-md:inset-0 max-md:w-full"
          >
            <PdfPanel
              docId={pdf.docId}
              docName={pdf.docName}
              page={pdf.page}
              onClose={() => setPdf(null)}
            />
          </aside>
        </>
      )}
    </div>
  )
}
