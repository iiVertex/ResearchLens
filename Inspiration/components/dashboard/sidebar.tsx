"use client"

import {
  FileText,
  PanelLeft,
  Plus,
  ScanSearch,
  Settings,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { documents, recentChats, type ResearchDocument } from "@/lib/dashboard-data"

type SidebarProps = {
  activeDocId: string
  onSelectDoc: (doc: ResearchDocument) => void
  onToggle: () => void
  onNewChat: () => void
}

export function Sidebar({
  activeDocId,
  onSelectDoc,
  onToggle,
  onNewChat,
}: SidebarProps) {
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
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse sidebar"
            onClick={onToggle}
          >
            <PanelLeft className="size-4" />
          </Button>
        </div>

        <Button variant="outline" className="h-9 w-full justify-start gap-2" onClick={onNewChat}>
          <Plus className="size-4" />
          New chat
        </Button>
        <Button className="h-9 w-full justify-start gap-2 bg-accent text-accent-foreground [a]:hover:bg-accent/90 hover:bg-accent/90">
          <Upload className="size-4" />
          Upload PDF
        </Button>
      </div>

      {/* Middle: documents */}
      <ScrollArea className="flex-1 px-3">
        <p className="px-1 pt-2 pb-2 font-mono text-[11px] tracking-wider text-muted-foreground">
          YOUR DOCUMENTS
        </p>
        <ul className="flex flex-col gap-0.5">
          {documents.map((doc) => {
            const active = doc.id === activeDocId
            return (
              <li key={doc.id}>
                <button
                  onClick={() => onSelectDoc(doc)}
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
                  <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {doc.chats}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </ScrollArea>

      {/* Bottom: recent chats + user */}
      <div className="px-3">
        <Separator />
        <p className="px-1 pt-3 pb-2 font-mono text-[11px] tracking-wider text-muted-foreground">
          RECENT CHATS
        </p>
        <ul className="flex flex-col gap-0.5 pb-2">
          {recentChats.slice(0, 5).map((chat) => (
            <li key={chat.id}>
              <button className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <span className="truncate">{chat.preview}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Separator />
      <div className="flex items-center gap-2 p-3">
        <Avatar size="sm">
          <AvatarFallback>EM</AvatarFallback>
        </Avatar>
        <span className="flex-1 truncate text-sm">Elena Moreau</span>
        <Button variant="ghost" size="icon-sm" aria-label="Settings">
          <Settings className="size-4" />
        </Button>
      </div>
    </div>
  )
}
