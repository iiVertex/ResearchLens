// Hand-maintained types mirroring the SQL migration in supabase/migrations.
// Keep in sync with the schema. (You can later regenerate with the Supabase CLI:
// `supabase gen types typescript --linked > lib/supabase/types.ts`.)

import type { Citation, Source } from "@/lib/citations"

export type { Citation, Source }
export type DocumentStatus = "processing" | "ready" | "error"
export type MessageRole = "user" | "assistant"

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          user_id: string
          name: string
          storage_path: string
          status: DocumentStatus
          num_pages: number | null
          error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          storage_path: string
          status?: DocumentStatus
          num_pages?: number | null
          error?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>
        Relationships: []
      }
      chunks: {
        Row: {
          id: string
          document_id: string
          content: string
          page: number
          chunk_index: number
          embedding: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          content: string
          page: number
          chunk_index: number
          embedding?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["chunks"]["Insert"]>
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          document_id: string
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_id: string
          title: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: MessageRole
          content: string
          citations: Citation[] | null
          sources: Source[] | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: MessageRole
          content: string
          citations?: Citation[] | null
          sources?: Source[] | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      match_chunks: {
        Args: {
          p_document_id: string
          p_query_embedding: string
          p_match_count: number
        }
        Returns: {
          id: string
          content: string
          page: number
          chunk_index: number
          similarity: number
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
