"use client"

import { useRef, useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ChatArea } from "@/components/dashboard/chat-area"
import { cn } from "@/lib/utils"
import {
  documents,
  initialMessages,
  mockResponses,
  type ChatMessage,
  type ResearchDocument,
} from "@/lib/dashboard-data"

export default function DashboardPage() {
  const [activeDoc, setActiveDoc] = useState<ResearchDocument>(documents[0])
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [isThinking, setIsThinking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const responseIndex = useRef(0)

  const handleSend = (text: string) => {
    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    }
    setMessages((prev) => [...prev, userMessage])
    setIsThinking(true)

    setTimeout(() => {
      const canned = mockResponses[responseIndex.current % mockResponses.length]
      responseIndex.current += 1
      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: canned.content,
        citations: canned.citations,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsThinking(false)
    }, 1000)
  }

  const handleSelectDoc = (doc: ResearchDocument) => {
    setActiveDoc(doc)
    setMessages([])
    // Close the sidebar on mobile after selecting.
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setIsThinking(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-foreground/20 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "z-40 h-full shrink-0 border-r border-sidebar-border transition-[margin] duration-300 ease-out",
          "max-md:fixed max-md:inset-y-0 max-md:left-0",
          sidebarOpen ? "ml-0" : "-ml-[260px] max-md:-translate-x-full max-md:ml-0",
        )}
      >
        <Sidebar
          activeDocId={activeDoc.id}
          onSelectDoc={handleSelectDoc}
          onToggle={() => setSidebarOpen(false)}
          onNewChat={handleNewChat}
        />
      </aside>

      {/* Main chat */}
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatArea
          activeDocName={activeDoc.name}
          messages={messages}
          isThinking={isThinking}
          sidebarCollapsed={!sidebarOpen}
          onSend={handleSend}
          onClear={handleNewChat}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      </main>
    </div>
  )
}
