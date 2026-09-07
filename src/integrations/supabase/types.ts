export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      credit_products: {
        Row: {
          active: boolean
          created_at: string
          credits: number
          id: string
          name: string
          price_usd: number
          stripe_price_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          credits: number
          id?: string
          name: string
          price_usd: number
          stripe_price_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          credits?: number
          id?: string
          name?: string
          price_usd?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          job_id: string | null
          stripe_payment_intent_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string | null
          stripe_payment_intent_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string | null
          stripe_payment_intent_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_sessions: {
        Row: {
          created_at: string
          id: string
          job_id: string
          session_number: number
          subtitle_txt_content: string | null
          summary_generated_at: string | null
          summary_text: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          session_number?: number
          subtitle_txt_content?: string | null
          summary_generated_at?: string | null
          summary_text?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          session_number?: number
          subtitle_txt_content?: string | null
          summary_generated_at?: string | null
          summary_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          current_session_id: string | null
          id: string
          language: string
          status: string
          topic: string | null
          updated_at: string
          user_id: string
          video_source_url: string
        }
        Insert: {
          created_at?: string
          current_session_id?: string | null
          id?: string
          language?: string
          status?: string
          topic?: string | null
          updated_at?: string
          user_id: string
          video_source_url: string
        }
        Update: {
          created_at?: string
          current_session_id?: string | null
          id?: string
          language?: string
          status?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
          video_source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_current_session"
            columns: ["current_session_id"]
            isOneToOne: false
            referencedRelation: "job_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          credits_balance: number
          email: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          credits_balance?: number
          email?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          credits_balance?: number
          email?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export const Constants = {
  public: { Enums: {} },
} as const
