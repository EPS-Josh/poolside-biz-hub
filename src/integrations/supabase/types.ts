export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          customer_id: string | null
          external_event_id: string | null
          id: string
          last_synced_at: string | null
          notes: string | null
          service_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          customer_id?: string | null
          external_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          notes?: string | null
          service_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          customer_id?: string | null
          external_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          notes?: string | null
          service_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_integrations: {
        Row: {
          access_token: string
          calendar_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_sync_log: {
        Row: {
          appointment_id: string | null
          created_at: string
          error_message: string | null
          external_event_id: string | null
          id: string
          integration_id: string
          sync_direction: string
          sync_status: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          error_message?: string | null
          external_event_id?: string | null
          id?: string
          integration_id: string
          sync_direction: string
          sync_status: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          error_message?: string | null
          external_event_id?: string | null
          id?: string
          integration_id?: string
          sync_direction?: string
          sync_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_log_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_log_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "calendar_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_data: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          insurance_policy_number: string | null
          insurance_provider: string | null
          license_number: string | null
          phone: string | null
          state: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          license_number?: string | null
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          license_number?: string | null
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      customer_photos: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_photos_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_service_details: {
        Row: {
          access_instructions: string | null
          chemical_preferences: string | null
          created_at: string
          customer_id: string
          gate_code: string | null
          id: string
          pool_equipment: string | null
          pool_size: string | null
          pool_type: string | null
          service_frequency: string | null
          spa_equipment: string | null
          spa_type: string | null
          special_notes: string | null
          updated_at: string
          water_features: string | null
        }
        Insert: {
          access_instructions?: string | null
          chemical_preferences?: string | null
          created_at?: string
          customer_id: string
          gate_code?: string | null
          id?: string
          pool_equipment?: string | null
          pool_size?: string | null
          pool_type?: string | null
          service_frequency?: string | null
          spa_equipment?: string | null
          spa_type?: string | null
          special_notes?: string | null
          updated_at?: string
          water_features?: string | null
        }
        Update: {
          access_instructions?: string | null
          chemical_preferences?: string | null
          created_at?: string
          customer_id?: string
          gate_code?: string | null
          id?: string
          pool_equipment?: string | null
          pool_size?: string | null
          pool_type?: string | null
          service_frequency?: string | null
          spa_equipment?: string | null
          spa_type?: string | null
          special_notes?: string | null
          updated_at?: string
          water_features?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_service_details_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          fps_item_number: string | null
          fps_sales_price: number | null
          height: number | null
          id: string
          item_number: string | null
          item_status: string | null
          length: number | null
          list_price: number | null
          low_stock_threshold: number | null
          markup_percentage: number | null
          min_order_qty: number | null
          name: string | null
          pieces_per_case: number | null
          pieces_per_pallet: number | null
          pieces_per_part: number | null
          quantity_in_stock: number
          sku: string | null
          solution: string | null
          superseded_item: string | null
          supplier_1_name: string | null
          supplier_1_price: number | null
          supplier_2_name: string | null
          supplier_2_price: number | null
          supplier_3_name: string | null
          supplier_3_price: number | null
          supplier_4_name: string | null
          supplier_4_price: number | null
          supplier_5_name: string | null
          supplier_5_price: number | null
          type: string | null
          unit_price: number | null
          upc: string | null
          updated_at: string
          user_id: string
          weight: number | null
          width: number | null
        }
        Insert: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          fps_item_number?: string | null
          fps_sales_price?: number | null
          height?: number | null
          id?: string
          item_number?: string | null
          item_status?: string | null
          length?: number | null
          list_price?: number | null
          low_stock_threshold?: number | null
          markup_percentage?: number | null
          min_order_qty?: number | null
          name?: string | null
          pieces_per_case?: number | null
          pieces_per_pallet?: number | null
          pieces_per_part?: number | null
          quantity_in_stock?: number
          sku?: string | null
          solution?: string | null
          superseded_item?: string | null
          supplier_1_name?: string | null
          supplier_1_price?: number | null
          supplier_2_name?: string | null
          supplier_2_price?: number | null
          supplier_3_name?: string | null
          supplier_3_price?: number | null
          supplier_4_name?: string | null
          supplier_4_price?: number | null
          supplier_5_name?: string | null
          supplier_5_price?: number | null
          type?: string | null
          unit_price?: number | null
          upc?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
          width?: number | null
        }
        Update: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          fps_item_number?: string | null
          fps_sales_price?: number | null
          height?: number | null
          id?: string
          item_number?: string | null
          item_status?: string | null
          length?: number | null
          list_price?: number | null
          low_stock_threshold?: number | null
          markup_percentage?: number | null
          min_order_qty?: number | null
          name?: string | null
          pieces_per_case?: number | null
          pieces_per_pallet?: number | null
          pieces_per_part?: number | null
          quantity_in_stock?: number
          sku?: string | null
          solution?: string | null
          superseded_item?: string | null
          supplier_1_name?: string | null
          supplier_1_price?: number | null
          supplier_2_name?: string | null
          supplier_2_price?: number | null
          supplier_3_name?: string | null
          supplier_3_price?: number | null
          supplier_4_name?: string | null
          supplier_4_price?: number | null
          supplier_5_name?: string | null
          supplier_5_price?: number | null
          type?: string | null
          unit_price?: number | null
          upc?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
          width?: number | null
        }
        Relationships: []
      }
      manuals: {
        Row: {
          category: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          manufacturer: string | null
          model: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type?: string | null
          id?: string
          manufacturer?: string | null
          model?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          manufacturer?: string | null
          model?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      parts_diagrams: {
        Row: {
          category: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          manufacturer: string | null
          model: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type?: string | null
          id?: string
          manufacturer?: string | null
          model?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          manufacturer?: string | null
          model?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_records: {
        Row: {
          after_readings: Json | null
          before_readings: Json | null
          chemicals_added: string | null
          created_at: string
          customer_id: string
          customer_notes: string | null
          equipment_serviced: string | null
          id: string
          next_service_date: string | null
          parts_used: Json | null
          photos_taken: string[] | null
          service_date: string
          service_status: string | null
          service_time: string | null
          service_type: string
          technician_name: string | null
          technician_notes: string | null
          total_time_minutes: number | null
          updated_at: string
          user_id: string
          work_performed: string | null
        }
        Insert: {
          after_readings?: Json | null
          before_readings?: Json | null
          chemicals_added?: string | null
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          equipment_serviced?: string | null
          id?: string
          next_service_date?: string | null
          parts_used?: Json | null
          photos_taken?: string[] | null
          service_date: string
          service_status?: string | null
          service_time?: string | null
          service_type: string
          technician_name?: string | null
          technician_notes?: string | null
          total_time_minutes?: number | null
          updated_at?: string
          user_id: string
          work_performed?: string | null
        }
        Update: {
          after_readings?: Json | null
          before_readings?: Json | null
          chemicals_added?: string | null
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          equipment_serviced?: string | null
          id?: string
          next_service_date?: string | null
          parts_used?: Json | null
          photos_taken?: string[] | null
          service_date?: string
          service_status?: string | null
          service_time?: string | null
          service_type?: string
          technician_name?: string | null
          technician_notes?: string | null
          total_time_minutes?: number | null
          updated_at?: string
          user_id?: string
          work_performed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_records_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          address: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string | null
          phone: string
          preferred_contact_method: string
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message?: string | null
          phone: string
          preferred_contact_method: string
          service_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string | null
          phone?: string
          preferred_contact_method?: string
          service_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      tsbs: {
        Row: {
          attachments: Json | null
          category: Database["public"]["Enums"]["tsb_category"]
          created_at: string
          description: string | null
          equipment_models: string[] | null
          estimated_time_minutes: number | null
          id: string
          is_active: boolean | null
          issue_description: string | null
          manufacturer: string | null
          parts_required: Json | null
          prevention_tips: string | null
          priority: Database["public"]["Enums"]["tsb_priority"]
          related_tsb_ids: string[] | null
          revision_number: number | null
          root_cause: string | null
          safety_notes: string | null
          solution_steps: string | null
          symptoms: string[] | null
          tags: string[] | null
          title: string
          tools_required: string[] | null
          troubleshooting_steps: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          category: Database["public"]["Enums"]["tsb_category"]
          created_at?: string
          description?: string | null
          equipment_models?: string[] | null
          estimated_time_minutes?: number | null
          id?: string
          is_active?: boolean | null
          issue_description?: string | null
          manufacturer?: string | null
          parts_required?: Json | null
          prevention_tips?: string | null
          priority?: Database["public"]["Enums"]["tsb_priority"]
          related_tsb_ids?: string[] | null
          revision_number?: number | null
          root_cause?: string | null
          safety_notes?: string | null
          solution_steps?: string | null
          symptoms?: string[] | null
          tags?: string[] | null
          title: string
          tools_required?: string[] | null
          troubleshooting_steps?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          category?: Database["public"]["Enums"]["tsb_category"]
          created_at?: string
          description?: string | null
          equipment_models?: string[] | null
          estimated_time_minutes?: number | null
          id?: string
          is_active?: boolean | null
          issue_description?: string | null
          manufacturer?: string | null
          parts_required?: Json | null
          prevention_tips?: string | null
          priority?: Database["public"]["Enums"]["tsb_priority"]
          related_tsb_ids?: string[] | null
          revision_number?: number | null
          root_cause?: string | null
          safety_notes?: string | null
          solution_steps?: string | null
          symptoms?: string[] | null
          tags?: string[] | null
          title?: string
          tools_required?: string[] | null
          troubleshooting_steps?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "technician" | "customer"
      tsb_category:
        | "Pump Systems"
        | "Filtration Systems"
        | "Heating Systems"
        | "Sanitization & Chemical Systems"
        | "Control Systems & Automation"
        | "Water Features & Accessories"
        | "Spa/Hot Tub Specific"
        | "Safety Equipment"
        | "Electrical Components"
        | "Plumbing & Hydraulics"
        | "In-Floor Cleaning Systems"
      tsb_priority: "Low" | "Medium" | "High" | "Critical"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "manager", "technician", "customer"],
      tsb_category: [
        "Pump Systems",
        "Filtration Systems",
        "Heating Systems",
        "Sanitization & Chemical Systems",
        "Control Systems & Automation",
        "Water Features & Accessories",
        "Spa/Hot Tub Specific",
        "Safety Equipment",
        "Electrical Components",
        "Plumbing & Hydraulics",
        "In-Floor Cleaning Systems",
      ],
      tsb_priority: ["Low", "Medium", "High", "Critical"],
    },
  },
} as const
