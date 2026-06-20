// Shared dashboard types + static UI copy. Live data now comes from /api
// (see lib/api.ts); the mock arrays that used to live here are gone.

export type { Citation } from "@/lib/citations"
export type {
  ChatMessage,
  ConversationItem,
  DocStatus,
  DocumentItem,
} from "@/lib/api"

export const suggestedQuestions = [
  "What problem does this paper solve?",
  "Summarize the methodology",
  "What are the key limitations?",
]
