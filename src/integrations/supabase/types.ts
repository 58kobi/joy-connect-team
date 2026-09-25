export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          assigned_to: string | null
          created_at: string
          customer_name: string | null
          email: string | null
          id: string
          issue: string | null
          last_message: string | null
          last_message_at: string
          mode: string
          order_number: string | null
          phone: string | null
          status: Database["public"]["Enums"]["chat_status"]
          token: string
          unread_staff: number
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          issue?: string | null
          last_message?: string | null
          last_message_at?: string
          mode?: string
          order_number?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["chat_status"]
          token: string
          unread_staff?: number
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          issue?: string | null
          last_message?: string | null
          last_message_at?: string
          mode?: string
          order_number?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["chat_status"]
          token?: string
          unread_staff?: number
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender: Database["public"]["Enums"]["chat_sender"]
          staff_id: string | null
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender: Database["public"]["Enums"]["chat_sender"]
          staff_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender?: Database["public"]["Enums"]["chat_sender"]
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_tracking: {
        Row: {
          reply: string | null
          status: Database["public"]["Enums"]["claim_status"]
          status_updated_at: string
          token: string
        }
        Insert: {
          reply?: string | null
          status: Database["public"]["Enums"]["claim_status"]
          status_updated_at: string
          token: string
        }
        Update: {
          reply?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          status_updated_at?: string
          token?: string
        }
        Relationships: []
      }
      claims: {
        Row: {
          category: string
          created_at: string
          customer_name: string
          description: string
          email: string
          id: string
          internal_note: string | null
          order_number: string | null
          phone: string | null
          ref: string
          reply: string | null
          seen: boolean
          status: Database["public"]["Enums"]["claim_status"]
          status_updated_at: string
          tracking_token: string
        }
        Insert: {
          category: string
          created_at?: string
          customer_name: string
          description: string
          email: string
          id?: string
          internal_note?: string | null
          order_number?: string | null
          phone?: string | null
          ref: string
          reply?: string | null
          seen?: boolean
          status?: Database["public"]["Enums"]["claim_status"]
          status_updated_at?: string
          tracking_token?: string
        }
        Update: {
          category?: string
          created_at?: string
          customer_name?: string
          description?: string
          email?: string
          id?: string
          internal_note?: string | null
          order_number?: string | null
          phone?: string | null
          ref?: string
          reply?: string | null
          seen?: boolean
          status?: Database["public"]["Enums"]["claim_status"]
          status_updated_at?: string
          tracking_token?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff"
      chat_sender: "customer" | "ai" | "staff" | "system" | "note"
      chat_status: "ai" | "waiting" | "active" | "handled"
      claim_status:
        | "received"
        | "under_review"
        | "being_handled"
        | "update_available"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
      chat_sender: ["customer", "ai", "staff", "system", "note"],
      chat_status: ["ai", "waiting", "active", "handled"],
      claim_status: [
        "received",
        "under_review",
        "being_handled",
        "update_available",
      ],
    },
  },
} as const
