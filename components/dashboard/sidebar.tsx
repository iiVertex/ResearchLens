"use client"

import { useRef } from "react"
import {
  AlertCircle,
  FileText,
  Loader2,
  LogOut,
  PanelLeft,
  Plus,
  ScanSearch,
  Trash2,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ConversationItem, DocumentItem } from "@/lib/api"

type SidebarProps = {
  userEmail: string
  documents: DocumentItem[]
  activeDocId: string | null
  conversations: ConversationItem[]
  activeConversationId: string | null
  uploading: boolean
  onSelectDoc: (id: string) => void
  onSelectConversation: (id: string) => void
  onDeleteDoc: (id: string) => void
  onUpload: (file: File) => void
  onNewChat: () => void
  onSignOut: () => void
  onToggle: () => void
}

function initials(email: string): string {
  const name = email.split("@")[0] ?? ""
  return (name.slice(0, 2) || "··").toUpperCase()
}

export function Sidebar({
  userEmail,
  documents,
  activeDocId,
  conversations,
  activeConversationId,
  uploading,
  onSelectDoc,
  onSelectConversation,
  onDeleteDoc,
  onUpload,
  onNewChat,
  onSignOut,
  onToggle,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    e.target.value = "" // allow re-uploading the same filename
  }

  return (
    <div className="flex h-full w-[260px] flex-col bg-sidebar text-sidebar-foreground">
      {/* Top section */}
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ScanSearch className="size-5 text-accent" />
            <span className="font-mono text-sm font-medium tracking-tight">
              ResearchLens
            </span>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Collapse sidebar" onClick={onToggle}>
            <PanelLeft className="size-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          className="h-9 w-full justify-start gap-2"
          onClick={onNewChat}
        >
          <Plus className="size-4" />
          New chat
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFile}
        />
        <Button
          className="h-9 w-full justify-start gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploading ? "Uploading…" : "Upload PDF"}
        </Button>
      </div>

      {/* Middle: documents */}
      <ScrollArea className="flex-1 px-3">
        <p className="px-1 pt-2 pb-2 font-mono text-[11px] tracking-wider text-muted-foreground">
          YOUR DOCUMENTS
        </p>
        {documents.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">
            No papers yet. Upload a PDF to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {documents.map((doc) => {
              const active = doc.id === activeDocId
              return (
                <li key={doc.id} className="group/doc relative">
                  <button
                    onClick={() => onSelectDoc(doc.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-accent/10 text-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <FileText
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-accent" : "text-muted-foreground",
                      )}
                    />
                    <span className="flex-1 truncate">{doc.name}</span>
                    <DocStatusBadge status={doc.status} />
                  </button>
                  <button
                    aria-label="Delete document"
                    onClick={() => onDeleteDoc(doc.id)}
                    className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover/doc:block"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </ScrollArea>

      {/* Bottom: recent chats + user */}
      <div className="px-3">
        <Separator />
        <p className="px-1 pt-3 pb-2 font-mono text-[11px] tracking-wider text-muted-foreground">
          RECENT CHATS
        </p>
        {conversations.length === 0 ? (
          <p className="px-1 pb-2 text-xs text-muted-foreground">
            No chats for this paper yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5 pb-2">
            {conversations.slice(0, 6).map((chat) => (
              <li key={chat.id}>
                <button
                  onClick={() => onSelectConversation(chat.id)}
                  className={cn(
                    "flex w-full items-center rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                    chat.id === activeConversationId
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span className="truncate">{chat.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Separator />
      <div className="flex items-center gap-2 p-3">
        <Avatar size="sm">
          <AvatarFallback>{initials(userEmail)}</AvatarFallback>
        </Avatar>
        <span className="flex-1 truncate text-sm" title={userEmail}>
          {userEmail}
        </span>
        <Button variant="ghost" size="icon-sm" aria-label="Sign out" onClick={onSignOut}>
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function DocStatusBadge({ status }: { status: DocumentItem["status"] }) {
  if (status === "processing") {
    return (
      <Loader2
        className="size-3.5 shrink-0 animate-spin text-muted-foreground"
        aria-label="Processing"
      />
    )
  }
  if (status === "error") {
    return <AlertCircle className="size-3.5 shrink-0 text-destructive" aria-label="Failed" />
  }
  return <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-label="Ready" />
}
