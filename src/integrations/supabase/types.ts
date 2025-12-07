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
    PostgrestVersion: "13.0.5"
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
          is_recurring: boolean | null
          last_synced_at: string | null
          notes: string | null
          occurrence_number: number | null
          recurring_end_date: string | null
          recurring_frequency: string | null
          recurring_parent_id: string | null
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
          is_recurring?: boolean | null
          last_synced_at?: string | null
          notes?: string | null
          occurrence_number?: number | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          recurring_parent_id?: string | null
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
          is_recurring?: boolean | null
          last_synced_at?: string | null
          notes?: string | null
          occurrence_number?: number | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          recurring_parent_id?: string | null
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
          {
            foreignKeyName: "appointments_recurring_parent_id_fkey"
            columns: ["recurring_parent_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      customer_plans_drawings: {
        Row: {
          category: string | null
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
          category?: string | null
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
          category?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
        }
        Relationships: []
      }
      customer_profile_history: {
        Row: {
          change_source: string | null
          changed_at: string
          changed_by: string | null
          created_at: string
          customer_id: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          change_source?: string | null
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          customer_id: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          change_source?: string | null
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          customer_id?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_profile_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_readings: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          reading_date: string
          reading_time: string
          readings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          reading_date: string
          reading_time: string
          readings: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          reading_date?: string
          reading_time?: string
          readings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      customer_scanned_documents: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          document_type: string | null
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
          document_type?: string | null
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
          document_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
        }
        Relationships: []
      }
      customer_service_details: {
        Row: {
          access_instructions: string | null
          acquisition_source: string | null
          chemical_preferences: string | null
          created_at: string
          customer_id: string
          gate_code: string | null
          id: string
          is_potential_customer: boolean | null
          pool_equipment: string | null
          pool_size: string | null
          pool_type: string | null
          potential_customer_notes: string | null
          proposed_rate: number | null
          service_day: string | null
          service_description: string | null
          service_frequency: string | null
          spa_equipment: string | null
          spa_type: string | null
          special_notes: string | null
          updated_at: string
          water_features: string | null
          weekly_rate: number | null
        }
        Insert: {
          access_instructions?: string | null
          acquisition_source?: string | null
          chemical_preferences?: string | null
          created_at?: string
          customer_id: string
          gate_code?: string | null
          id?: string
          is_potential_customer?: boolean | null
          pool_equipment?: string | null
          pool_size?: string | null
          pool_type?: string | null
          potential_customer_notes?: string | null
          proposed_rate?: number | null
          service_day?: string | null
          service_description?: string | null
          service_frequency?: string | null
          spa_equipment?: string | null
          spa_type?: string | null
          special_notes?: string | null
          updated_at?: string
          water_features?: string | null
          weekly_rate?: number | null
        }
        Update: {
          access_instructions?: string | null
          acquisition_source?: string | null
          chemical_preferences?: string | null
          created_at?: string
          customer_id?: string
          gate_code?: string | null
          id?: string
          is_potential_customer?: boolean | null
          pool_equipment?: string | null
          pool_size?: string | null
          pool_type?: string | null
          potential_customer_notes?: string | null
          proposed_rate?: number | null
          service_day?: string | null
          service_description?: string | null
          service_frequency?: string | null
          spa_equipment?: string | null
          spa_type?: string | null
          special_notes?: string | null
          updated_at?: string
          water_features?: string | null
          weekly_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_service_details_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
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
          customer_user_id: string | null
          email: string | null
          first_name: string
          geocoded_at: string | null
          id: string
          last_name: string
          latitude: number | null
          longitude: number | null
          mailing_address: string | null
          mailing_city: string | null
          mailing_state: string | null
          mailing_zip_code: string | null
          non_pima_verification_method: string | null
          non_pima_verification_notes: string | null
          non_pima_verified_at: string | null
          non_pima_verified_by: string | null
          notes: string | null
          owner_changed_by: string | null
          owner_changed_date: string | null
          owner_verified_at: string | null
          owner_verified_by: string | null
          phone: string | null
          phone_verified: boolean | null
          pima_county_resident: boolean | null
          previous_first_name: string | null
          previous_last_name: string | null
          sms_opt_in: boolean | null
          sms_opt_in_date: string | null
          state: string | null
          updated_at: string
          user_id: string
          verification_status: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          customer_user_id?: string | null
          email?: string | null
          first_name: string
          geocoded_at?: string | null
          id?: string
          last_name: string
          latitude?: number | null
          longitude?: number | null
          mailing_address?: string | null
          mailing_city?: string | null
          mailing_state?: string | null
          mailing_zip_code?: string | null
          non_pima_verification_method?: string | null
          non_pima_verification_notes?: string | null
          non_pima_verified_at?: string | null
          non_pima_verified_by?: string | null
          notes?: string | null
          owner_changed_by?: string | null
          owner_changed_date?: string | null
          owner_verified_at?: string | null
          owner_verified_by?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          pima_county_resident?: boolean | null
          previous_first_name?: string | null
          previous_last_name?: string | null
          sms_opt_in?: boolean | null
          sms_opt_in_date?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          customer_user_id?: string | null
          email?: string | null
          first_name?: string
          geocoded_at?: string | null
          id?: string
          last_name?: string
          latitude?: number | null
          longitude?: number | null
          mailing_address?: string | null
          mailing_city?: string | null
          mailing_state?: string | null
          mailing_zip_code?: string | null
          non_pima_verification_method?: string | null
          non_pima_verification_notes?: string | null
          non_pima_verified_at?: string | null
          non_pima_verified_by?: string | null
          notes?: string | null
          owner_changed_by?: string | null
          owner_changed_date?: string | null
          owner_verified_at?: string | null
          owner_verified_by?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          pima_county_resident?: boolean | null
          previous_first_name?: string | null
          previous_last_name?: string | null
          sms_opt_in?: boolean | null
          sms_opt_in_date?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
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
          epool_item_number: string | null
          fps_item_number: string | null
          fps_sales_price: number | null
          height: number | null
          heritage_item_number: string | null
          horizon_item_number: string | null
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
          pool360_item_number: string | null
          pwp_item_number: string | null
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
          epool_item_number?: string | null
          fps_item_number?: string | null
          fps_sales_price?: number | null
          height?: number | null
          heritage_item_number?: string | null
          horizon_item_number?: string | null
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
          pool360_item_number?: string | null
          pwp_item_number?: string | null
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
          epool_item_number?: string | null
          fps_item_number?: string | null
          fps_sales_price?: number | null
          height?: number | null
          heritage_item_number?: string | null
          horizon_item_number?: string | null
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
          pool360_item_number?: string | null
          pwp_item_number?: string | null
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
      pima_assessor_records: {
        Row: {
          created_at: string | null
          id: string
          is_owner_updated: boolean | null
          Mail1: string | null
          Mail2: string | null
          Mail3: string | null
          Mail4: string | null
          Mail5: string | null
          owner_updated_at: string | null
          owner_updated_by: string | null
          Parcel: string | null
          updated_at: string | null
          updated_owner_name: string | null
          Zip: string | null
          Zip4: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_owner_updated?: boolean | null
          Mail1?: string | null
          Mail2?: string | null
          Mail3?: string | null
          Mail4?: string | null
          Mail5?: string | null
          owner_updated_at?: string | null
          owner_updated_by?: string | null
          Parcel?: string | null
          updated_at?: string | null
          updated_owner_name?: string | null
          Zip?: string | null
          Zip4?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_owner_updated?: boolean | null
          Mail1?: string | null
          Mail2?: string | null
          Mail3?: string | null
          Mail4?: string | null
          Mail5?: string | null
          owner_updated_at?: string | null
          owner_updated_by?: string | null
          Parcel?: string | null
          updated_at?: string | null
          updated_owner_name?: string | null
          Zip?: string | null
          Zip4?: string | null
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
      quickbooks_connections: {
        Row: {
          access_token: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quickbooks_customer_sync: {
        Row: {
          created_at: string
          customer_id: string
          error_message: string | null
          id: string
          last_synced_at: string | null
          quickbooks_customer_id: string | null
          sync_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          error_message?: string | null
          id?: string
          last_synced_at?: string | null
          quickbooks_customer_id?: string | null
          sync_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          error_message?: string | null
          id?: string
          last_synced_at?: string | null
          quickbooks_customer_id?: string | null
          sync_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_customer_sync_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_invoice_sync: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_synced_at: string | null
          quickbooks_invoice_id: string | null
          service_record_id: string
          sync_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_synced_at?: string | null
          quickbooks_invoice_id?: string | null
          service_record_id: string
          sync_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_synced_at?: string | null
          quickbooks_invoice_id?: string | null
          service_record_id?: string
          sync_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_invoice_sync_service_record_id_fkey"
            columns: ["service_record_id"]
            isOneToOne: false
            referencedRelation: "service_records"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_log: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string
        }
        Relationships: []
      }
      saved_service_routes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          route_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          route_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          route_data?: Json
          updated_at?: string
          user_id?: string
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
          follow_up_completed: boolean | null
          follow_up_completed_at: string | null
          follow_up_date: string | null
          follow_up_notes: string | null
          id: string
          invoicing_status: string
          needs_follow_up: boolean | null
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
          follow_up_completed?: boolean | null
          follow_up_completed_at?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          id?: string
          invoicing_status?: string
          needs_follow_up?: boolean | null
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
          follow_up_completed?: boolean | null
          follow_up_completed_at?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          id?: string
          invoicing_status?: string
          needs_follow_up?: boolean | null
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
      sms_logs: {
        Row: {
          created_at: string | null
          customer_id: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          message_content: string
          message_sid: string | null
          phone_number: string
          sent_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message_content: string
          message_sid?: string | null
          phone_number: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message_content?: string
          message_sid?: string | null
          phone_number?: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_prices: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string
          price: number | null
          supplier_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id: string
          price?: number | null
          supplier_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string
          price?: number | null
          supplier_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_prices_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_prices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          last_price_update: string | null
          name: string
          notes: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          last_price_update?: string | null
          name: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          last_price_update?: string | null
          name?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
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
      cleanup_expired_tokens: { Args: never; Returns: undefined }
      get_current_user_context: { Args: never; Returns: Json }
      get_customer_service_data: {
        Args: { customer_filter_id?: string; limit_results?: number }
        Returns: {
          address: string
          city: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string
          owner_verified_at: string
          phone: string
          pima_county_resident: boolean
          state: string
          updated_at: string
          verification_status: string
          zip_code: string
        }[]
      }
      get_customer_verification_fields: {
        Args: { customer_id: string }
        Returns: {
          owner_verified_at: string
          owner_verified_by: string
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      log_sensitive_data_access: {
        Args: {
          access_type: string
          accessed_table: string
          customer_id: string
        }
        Returns: undefined
      }
      search_assessor_by_address: {
        Args: { search_address: string }
        Returns: {
          id: string
          is_owner_updated: boolean
          Mail1: string
          Mail2: string
          Mail3: string
          Mail4: string
          Mail5: string
          owner_updated_at: string
          Parcel: string
          updated_at: string
          updated_owner_name: string
          Zip: string
          Zip4: string
        }[]
      }
      search_assessor_by_last_name: {
        Args: { search_term: string }
        Returns: {
          created_at: string
          id: string
          is_owner_updated: boolean
          Mail1: string
          Mail2: string
          Mail3: string
          Mail4: string
          Mail5: string
          owner_updated_at: string
          owner_updated_by: string
          Parcel: string
          updated_at: string
          updated_owner_name: string
          Zip: string
          Zip4: string
        }[]
      }
      search_assessor_global: {
        Args: { limit_val?: number; offset_val?: number; search_term: string }
        Returns: {
          created_at: string
          id: string
          is_owner_updated: boolean
          Mail1: string
          Mail2: string
          Mail3: string
          Mail4: string
          Mail5: string
          owner_updated_at: string
          owner_updated_by: string
          Parcel: string
          updated_at: string
          updated_owner_name: string
          Zip: string
          Zip4: string
        }[]
      }
      validate_role_assignment: {
        Args: {
          role_to_assign: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "technician" | "customer" | "guest"
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
      app_role: ["admin", "manager", "technician", "customer", "guest"],
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
