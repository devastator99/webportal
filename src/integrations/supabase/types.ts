export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analyzed_documents: {
        Row: {
          analysis_text: string | null
          created_at: string
          doctor_id: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          original_filename: string
          updated_at: string
        }
        Insert: {
          analysis_text?: string | null
          created_at?: string
          doctor_id: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          original_filename: string
          updated_at?: string
        }
        Update: {
          analysis_text?: string | null
          created_at?: string
          doctor_id?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          original_filename?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyzed_documents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          doctor_id: string
          email_notification_sent: boolean | null
          id: string
          notes: string | null
          patient_id: string
          payment_confirmed: boolean | null
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string
          whatsapp_notification_sent: boolean | null
        }
        Insert: {
          created_at?: string
          doctor_id: string
          email_notification_sent?: boolean | null
          id?: string
          notes?: string | null
          patient_id: string
          payment_confirmed?: boolean | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string
          whatsapp_notification_sent?: boolean | null
        }
        Update: {
          created_at?: string
          doctor_id?: string
          email_notification_sent?: boolean | null
          id?: string
          notes?: string | null
          patient_id?: string
          payment_confirmed?: boolean | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string
          whatsapp_notification_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_profile_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          message: string | null
          message_type: Database["public"]["Enums"]["message_type"] | null
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          message?: string | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          message?: string | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_receiver_profile_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_profile_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          patient_id: string | null
          room_type: Database["public"]["Enums"]["chat_room_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          patient_id?: string | null
          room_type?: Database["public"]["Enums"]["chat_room_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          patient_id?: string | null
          room_type?: Database["public"]["Enums"]["chat_room_type"]
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_knowledge: {
        Row: {
          content: Json
          created_at: string
          id: string
          topic: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          topic: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      doctor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string | null
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id?: string | null
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string | null
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_summaries: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          summary: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          summary: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_summaries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "medical_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_resources: {
        Row: {
          created_at: string
          description: string | null
          file_url: string
          id: string
          resource_type: Database["public"]["Enums"]["message_type"]
          title: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url: string
          id?: string
          resource_type: Database["public"]["Enums"]["message_type"]
          title: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string
          id?: string
          resource_type?: Database["public"]["Enums"]["message_type"]
          title?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      health_plan_items: {
        Row: {
          created_at: string
          description: string
          duration: string | null
          frequency: string
          id: string
          nutritionist_id: string
          patient_id: string
          scheduled_time: string
          type: string
        }
        Insert: {
          created_at?: string
          description: string
          duration?: string | null
          frequency: string
          id?: string
          nutritionist_id: string
          patient_id: string
          scheduled_time: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          duration?: string | null
          frequency?: string
          id?: string
          nutritionist_id?: string
          patient_id?: string
          scheduled_time?: string
          type?: string
        }
        Relationships: []
      }
      knowledge_videos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          uploaded_by: string
          uploader_role: Database["public"]["Enums"]["user_type"]
          video_path: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          uploaded_by: string
          uploader_role: Database["public"]["Enums"]["user_type"]
          video_path: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
          uploader_role?: Database["public"]["Enums"]["user_type"]
          video_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_videos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          medical_record_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          medical_record_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          medical_record_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_documents_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          created_at: string
          diagnosis: string | null
          doctor_id: string | null
          id: string
          notes: string | null
          patient_id: string
          prescription: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          prescription?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          prescription?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      patient_assignments: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          nutritionist_id: string | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          nutritionist_id?: string | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          nutritionist_id?: string | null
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_assignments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assignments_nutritionist_profile_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assignments_patient_profile_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_medical_reports: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          patient_id: string
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          patient_id: string
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          patient_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_patient_profile"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medical_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string
          created_at: string
          currency: string
          id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id: string
          created_at?: string
          currency?: string
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string
          created_at?: string
          currency?: string
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          clinic_location: string | null
          consultation_fee: number | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          specialty: string | null
          updated_at: string
          visiting_hours: string | null
        }
        Insert: {
          clinic_location?: string | null
          consultation_fee?: number | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          visiting_hours?: string | null
        }
        Update: {
          clinic_location?: string | null
          consultation_fee?: number | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          visiting_hours?: string | null
        }
        Relationships: []
      }
      room_members: {
        Row: {
          id: string
          is_admin: boolean | null
          joined_at: string
          role: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_admin?: boolean | null
          joined_at?: string
          role?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_admin?: boolean | null
          joined_at?: string
          role?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "care_team_rooms_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          created_at: string
          id: string
          is_ai_message: boolean | null
          is_system_message: boolean | null
          message: string
          message_type: string | null
          read_by: Json | null
          room_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_ai_message?: boolean | null
          is_system_message?: boolean | null
          message: string
          message_type?: string | null
          read_by?: Json | null
          room_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_ai_message?: boolean | null
          is_system_message?: boolean | null
          message?: string
          message_type?: string | null
          read_by?: Json | null
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "care_team_rooms_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      care_team_rooms_view: {
        Row: {
          created_at: string | null
          last_message: string | null
          last_message_time: string | null
          member_count: number | null
          patient_id: string | null
          patient_name: string | null
          room_description: string | null
          room_id: string | null
          room_name: string | null
          room_type: Database["public"]["Enums"]["chat_room_type"] | null
        }
        Relationships: []
      }
      detailed_payment_reports: {
        Row: {
          amount: number | null
          appointment_date: string | null
          currency: string | null
          doctor_first_name: string | null
          doctor_last_name: string | null
          patient_first_name: string | null
          patient_last_name: string | null
          payment_date: string | null
          payment_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_assign_care_team: {
        Args: {
          p_patient_id: string
          p_doctor_id: string
          p_nutritionist_id: string
          p_admin_id: string
        }
        Returns: Json
      }
      admin_assign_nutritionist_to_patient: {
        Args: {
          p_nutritionist_id: string
          p_patient_id: string
          p_admin_id: string
        }
        Returns: Json
      }
      assign_doctor_to_patient: {
        Args: { p_patient_id: string; p_doctor_id: string }
        Returns: string
      }
      assign_nutritionist_to_patient: {
        Args: { p_patient_id: string; p_nutritionist_id: string }
        Returns: Json
      }
      assign_patient_to_nutritionist: {
        Args: {
          p_patient_id: string
          p_nutritionist_id: string
          p_doctor_id: string
        }
        Returns: string
      }
      can_insert_user_role: {
        Args: { checking_user_id: string }
        Returns: boolean
      }
      check_admin_role: {
        Args: { user_id: string }
        Returns: boolean
      }
      check_appointment_access: {
        Args: { checking_appointment_id: string }
        Returns: boolean
      }
      check_medical_document_access: {
        Args: { document_id: string }
        Returns: boolean
      }
      check_patient_medical_access: {
        Args: { checking_patient_id: string }
        Returns: boolean
      }
      check_user_exists: {
        Args: { p_email: string }
        Returns: boolean
      }
      check_user_role_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_appointment: {
        Args: {
          p_patient_id: string
          p_doctor_id: string
          p_scheduled_at: string
          p_status?: Database["public"]["Enums"]["appointment_status"]
        }
        Returns: {
          appointment_id: string
          patient_id: string
          doctor_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
        }[]
      }
      create_care_team_room: {
        Args: {
          p_patient_id: string
          p_doctor_id: string
          p_nutritionist_id?: string
        }
        Returns: string
      }
      create_medical_record: {
        Args: {
          p_patient_id: string
          p_doctor_id: string
          p_diagnosis: string
          p_prescription: string
          p_notes: string
        }
        Returns: string
      }
      create_test_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_admin_doctors: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          first_name: string
          last_name: string
        }[]
      }
      get_admin_nutritionists: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          first_name: string
          last_name: string
        }[]
      }
      get_admin_patients: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          first_name: string
          last_name: string
        }[]
      }
      get_administrators: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          first_name: string
          last_name: string
        }[]
      }
      get_all_patients: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          first_name: string
          last_name: string
        }[]
      }
      get_appointments_by_date: {
        Args: { p_doctor_id: string; p_date: string }
        Returns: {
          id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          patient_json: Json
        }[]
      }
      get_care_team_messages: {
        Args: {
          p_user_id: string
          p_patient_id: string
          p_offset?: number
          p_limit?: number
        }
        Returns: {
          id: string
          message: string
          message_type: string
          created_at: string
          read: boolean
          sender: Json
          receiver: Json
        }[]
      }
      get_chatbot_knowledge: {
        Args: { topic_filter?: string }
        Returns: {
          id: string
          topic: string
          content: Json
          created_at: string
          updated_at: string
        }[]
      }
      get_doctor_appointments: {
        Args: { doctor_id: string }
        Returns: {
          id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
        }[]
      }
      get_doctor_appointments_with_patients: {
        Args: { doctor_id: string; date_filter: string }
        Returns: {
          id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          patient: Json
        }[]
      }
      get_doctor_medical_records_count: {
        Args: { doctor_id: string }
        Returns: number
      }
      get_doctor_patient_records: {
        Args: { p_doctor_id: string; p_patient_id: string }
        Returns: {
          id: string
          created_at: string
          diagnosis: string
          prescription: string
          notes: string
          doctor_id: string
        }[]
      }
      get_doctor_patients: {
        Args: { p_doctor_id: string }
        Returns: {
          id: string
          first_name: string
          last_name: string
        }[]
      }
      get_doctor_patients_count: {
        Args: { doctor_id: string }
        Returns: number
      }
      get_doctor_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          first_name: string
          last_name: string
          specialty: string
          visiting_hours: string
          clinic_location: string
          consultation_fee: number
        }[]
      }
      get_doctors: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          first_name: string
          last_name: string
        }[]
      }
      get_doctors_for_chatbot: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_medical_report_url: {
        Args: { p_report_id: string }
        Returns: string
      }
      get_nutritionist_patients: {
        Args: { p_nutritionist_id: string }
        Returns: {
          id: string
          patient_id: string
          created_at: string
          patient_first_name: string
          patient_last_name: string
        }[]
      }
      get_nutritionists: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          first_name: string
          last_name: string
        }[]
      }
      get_patient_appointments: {
        Args: { p_patient_id: string }
        Returns: {
          id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          doctor_first_name: string
          doctor_last_name: string
        }[]
      }
      get_patient_assignments_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          patient_id: string
          patient_first_name: string
          patient_last_name: string
          doctor_id: string
          doctor_first_name: string
          doctor_last_name: string
          nutritionist_id: string
          nutritionist_first_name: string
          nutritionist_last_name: string
        }[]
      }
      get_patient_care_team: {
        Args: { p_patient_id: string }
        Returns: {
          id: string
          first_name: string
          last_name: string
          role: string
        }[]
      }
      get_patient_care_team_members: {
        Args: { p_patient_id: string }
        Returns: {
          id: string
          first_name: string
          last_name: string
          role: string
        }[]
      }
      get_patient_care_team_room: {
        Args: { p_patient_id: string }
        Returns: string
      }
      get_patient_doctor_assignments: {
        Args: Record<PropertyKey, never>
        Returns: {
          patient_id: string
          doctor_id: string
        }[]
      }
      get_patient_health_plan: {
        Args: { p_patient_id: string }
        Returns: {
          id: string
          type: string
          scheduled_time: string
          description: string
          frequency: string
          duration: string
        }[]
      }
      get_patient_medical_records: {
        Args: { p_patient_id: string; p_doctor_id: string }
        Returns: {
          id: string
          created_at: string
          diagnosis: string
          prescription: string
          notes: string
          doctor_id: string
          patient_id: string
          doctor_first_name: string
          doctor_last_name: string
        }[]
      }
      get_patient_medical_reports: {
        Args: { p_patient_id: string }
        Returns: {
          id: string
          file_name: string
          file_path: string
          uploaded_at: string
        }[]
      }
      get_patient_nutritionist_assignments: {
        Args: Record<PropertyKey, never>
        Returns: {
          patient_id: string
          nutritionist_id: string
        }[]
      }
      get_patient_prescriptions: {
        Args: { p_patient_id: string; p_doctor_id: string }
        Returns: {
          id: string
          created_at: string
          diagnosis: string
          prescription: string
          notes: string
          doctor_id: string
          patient_id: string
          doctor_first_name: string
          doctor_last_name: string
          patient_first_name: string
          patient_last_name: string
        }[]
      }
      get_patients: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          first_name: string
          last_name: string
        }[]
      }
      get_room_messages: {
        Args: { p_room_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          id: string
          sender_id: string
          sender_name: string
          sender_role: string
          message: string
          is_system_message: boolean
          is_ai_message: boolean
          created_at: string
        }[]
      }
      get_signed_medical_report_url: {
        Args: { p_report_id: string }
        Returns: string
      }
      get_user_care_team_rooms: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string | null
          last_message: string | null
          last_message_time: string | null
          member_count: number | null
          patient_id: string | null
          patient_name: string | null
          room_description: string | null
          room_id: string | null
          room_name: string | null
          room_type: Database["public"]["Enums"]["chat_room_type"] | null
        }[]
      }
      get_user_chat_messages: {
        Args: {
          p_user_id: string
          p_other_user_id: string
          p_offset?: number
          p_limit?: number
        }
        Returns: {
          id: string
          message: string
          message_type: string
          created_at: string
          read: boolean
          sender: Json
          receiver: Json
        }[]
      }
      get_user_role: {
        Args: { lookup_user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["user_type"]
        }[]
      }
      get_users_by_role: {
        Args: { role_name: Database["public"]["Enums"]["user_type"] }
        Returns: {
          user_id: string
        }[]
      }
      get_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: string
        }[]
      }
      has_role: {
        Args: { role_to_check: Database["public"]["Enums"]["user_type"] }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_current_user_admin_fixed: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_doctor: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_reception: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_room_member: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      mark_messages_as_read: {
        Args: { p_user_id: string; p_sender_id: string }
        Returns: boolean
      }
      save_health_plan_items: {
        Args: { p_patient_id: string; p_nutritionist_id: string; p_items: Json }
        Returns: string[]
      }
      save_prescription: {
        Args: {
          p_patient_id: string
          p_doctor_id: string
          p_diagnosis: string
          p_prescription: string
          p_notes: string
        }
        Returns: string
      }
      search_chatbot_knowledge: {
        Args: { search_term: string }
        Returns: {
          id: string
          topic: string
          content: Json
          created_at: string
          updated_at: string
        }[]
      }
      send_chat_message: {
        Args: {
          p_sender_id: string
          p_receiver_id: string
          p_message: string
          p_message_type?: string
        }
        Returns: string
      }
      send_room_message: {
        Args: {
          p_room_id: string
          p_message: string
          p_is_system_message?: boolean
          p_is_ai_message?: boolean
        }
        Returns: string
      }
      user_can_sync_rooms: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_appointment_date: {
        Args: { p_doctor_id: string; p_scheduled_date: string }
        Returns: boolean
      }
    }
    Enums: {
      appointment_status: "scheduled" | "completed" | "cancelled"
      chat_room_type: "care_team" | "direct" | "group"
      message_type: "text" | "file" | "video"
      payment_status: "pending" | "completed" | "failed"
      user_type:
        | "patient"
        | "doctor"
        | "nutritionist"
        | "administrator"
        | "reception"
        | "aibot"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: ["scheduled", "completed", "cancelled"],
      chat_room_type: ["care_team", "direct", "group"],
      message_type: ["text", "file", "video"],
      payment_status: ["pending", "completed", "failed"],
      user_type: [
        "patient",
        "doctor",
        "nutritionist",
        "administrator",
        "reception",
        "aibot",
      ],
    },
  },
} as const
