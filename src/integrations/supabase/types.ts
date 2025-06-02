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
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "analyzed_documents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "analyzed_documents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyzed_documents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyzed_documents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
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
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "appointments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "appointments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "appointments_patient_profile_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "appointments_patient_profile_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "appointments_patient_profile_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_profile_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_profile_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
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
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "chat_messages_receiver_profile_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "chat_messages_receiver_profile_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_receiver_profile_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_receiver_profile_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_sender_profile_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "chat_messages_sender_profile_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "chat_messages_sender_profile_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_profile_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_profile_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
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
      default_care_teams: {
        Row: {
          created_at: string | null
          default_doctor_id: string | null
          default_nutritionist_id: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_doctor_id?: string | null
          default_nutritionist_id?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_doctor_id?: string | null
          default_nutritionist_id?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
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
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
          },
        ]
      }
      doctor_details: {
        Row: {
          clinic_address: string | null
          clinic_phone: string | null
          created_at: string | null
          id: string
          qualifications: string | null
          registration_number: string | null
          signature_url: string | null
          specialization: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_address?: string | null
          clinic_phone?: string | null
          created_at?: string | null
          id: string
          qualifications?: string | null
          registration_number?: string | null
          signature_url?: string | null
          specialization?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_address?: string | null
          clinic_phone?: string | null
          created_at?: string | null
          id?: string
          qualifications?: string | null
          registration_number?: string | null
          signature_url?: string | null
          specialization?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "doctor_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "doctor_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
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
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "knowledge_videos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "knowledge_videos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_videos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_videos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
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
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["prescription_id"]
          },
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
          follow_up_date: string | null
          format_type: string | null
          id: string
          notes: string | null
          patient_id: string
          prescription: string | null
          updated_at: string
          validity_period: number | null
          vitals: Json | null
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          follow_up_date?: string | null
          format_type?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          prescription?: string | null
          updated_at?: string
          validity_period?: number | null
          vitals?: Json | null
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          follow_up_date?: string | null
          format_type?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          prescription?: string | null
          updated_at?: string
          validity_period?: number | null
          vitals?: Json | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          error: string | null
          id: string
          status: string
          subscription_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          error?: string | null
          id?: string
          status: string
          subscription_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          error?: string | null
          id?: string
          status?: string
          subscription_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          appointment_enabled: boolean | null
          created_at: string
          general_enabled: boolean | null
          health_plan_enabled: boolean | null
          id: string
          medication_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_enabled?: boolean | null
          created_at?: string
          general_enabled?: boolean | null
          health_plan_enabled?: boolean | null
          id?: string
          medication_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_enabled?: boolean | null
          created_at?: string
          general_enabled?: boolean | null
          health_plan_enabled?: boolean | null
          id?: string
          medication_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_otps: {
        Row: {
          created_at: string | null
          email: string | null
          expires_at: string
          id: string
          otp_code: string
          phone_number: string | null
          reset_method: Database["public"]["Enums"]["reset_method"]
          used: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          expires_at: string
          id?: string
          otp_code: string
          phone_number?: string | null
          reset_method?: Database["public"]["Enums"]["reset_method"]
          used?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          otp_code?: string
          phone_number?: string | null
          reset_method?: Database["public"]["Enums"]["reset_method"]
          used?: boolean | null
          user_id?: string | null
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
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "patient_assignments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_assignments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assignments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assignments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patient_assignments_nutritionist_profile_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "patient_assignments_nutritionist_profile_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_assignments_nutritionist_profile_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assignments_nutritionist_profile_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assignments_nutritionist_profile_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patient_assignments_patient_profile_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "patient_assignments_patient_profile_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_assignments_patient_profile_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assignments_patient_profile_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assignments_patient_profile_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_details: {
        Row: {
          allergies: string | null
          blood_group: string | null
          chronic_conditions: string | null
          created_at: string | null
          date_of_birth: string | null
          emergency_contact: string | null
          gender: string | null
          height: number | null
          id: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          allergies?: string | null
          blood_group?: string | null
          chronic_conditions?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          emergency_contact?: string | null
          gender?: string | null
          height?: number | null
          id: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          allergies?: string | null
          blood_group?: string | null
          chronic_conditions?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          emergency_contact?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "patient_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          doctor_id: string | null
          email_sent: boolean | null
          id: string
          invoice_number: string
          patient_id: string
          payment_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          updated_at: string
          whatsapp_sent: boolean | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          doctor_id?: string | null
          email_sent?: boolean | null
          id?: string
          invoice_number: string
          patient_id: string
          payment_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          updated_at?: string
          whatsapp_sent?: boolean | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          doctor_id?: string | null
          email_sent?: boolean | null
          id?: string
          invoice_number?: string
          patient_id?: string
          payment_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          updated_at?: string
          whatsapp_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_invoices_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "patient_invoices_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_invoices_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_invoices_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_invoices_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patient_invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "patient_invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
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
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "fk_patient_profile"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_patient_profile"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_patient_profile"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_patient_profile"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patient_medical_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "patient_medical_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_medical_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medical_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medical_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          consultation_fee: number
          created_at: string
          currency: string
          id: string
          updated_at: string
        }
        Insert: {
          consultation_fee?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
        }
        Update: {
          consultation_fee?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
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
      prescribed_tests: {
        Row: {
          created_at: string | null
          id: string
          instructions: string | null
          prescription_id: string | null
          test_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instructions?: string | null
          prescription_id?: string | null
          test_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instructions?: string | null
          prescription_id?: string | null
          test_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescribed_tests_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["prescription_id"]
          },
          {
            foreignKeyName: "prescribed_tests_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_medications: {
        Row: {
          created_at: string | null
          dosage: string
          duration: string | null
          frequency: string
          id: string
          instructions: string | null
          medication_name: string
          prescription_id: string | null
          timing: string | null
        }
        Insert: {
          created_at?: string | null
          dosage: string
          duration?: string | null
          frequency: string
          id?: string
          instructions?: string | null
          medication_name: string
          prescription_id?: string | null
          timing?: string | null
        }
        Update: {
          created_at?: string | null
          dosage?: string
          duration?: string | null
          frequency?: string
          id?: string
          instructions?: string | null
          medication_name?: string
          prescription_id?: string | null
          timing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_medications_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["prescription_id"]
          },
          {
            foreignKeyName: "prescription_medications_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
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
          registration_completed_at: string | null
          registration_status:
            | Database["public"]["Enums"]["registration_status"]
            | null
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
          registration_completed_at?: string | null
          registration_status?:
            | Database["public"]["Enums"]["registration_status"]
            | null
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
          registration_completed_at?: string | null
          registration_status?:
            | Database["public"]["Enums"]["registration_status"]
            | null
          specialty?: string | null
          updated_at?: string
          visiting_hours?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      registration_tasks: {
        Row: {
          created_at: string
          error_details: Json | null
          id: string
          next_retry_at: string
          priority: number
          result_payload: Json | null
          retry_count: number
          status: Database["public"]["Enums"]["task_status"]
          task_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          id?: string
          next_retry_at?: string
          priority?: number
          result_payload?: Json | null
          retry_count?: number
          status?: Database["public"]["Enums"]["task_status"]
          task_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          id?: string
          next_retry_at?: string
          priority?: number
          result_payload?: Json | null
          retry_count?: number
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: string
          updated_at?: string
          user_id?: string
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
      scheduled_sms: {
        Row: {
          created_at: string
          id: number
          message_body: string
          phone_number: string
          scheduled_for: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: number
          message_body: string
          phone_number: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: number
          message_body?: string
          phone_number?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          level: string | null
          message: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          level?: string | null
          message?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          level?: string | null
          message?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
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
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
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
      comprehensive_prescriptions: {
        Row: {
          clinic_address: string | null
          clinic_phone: string | null
          diagnosis: string | null
          doctor_first_name: string | null
          doctor_id: string | null
          doctor_last_name: string | null
          doctor_qualifications: string | null
          doctor_registration: string | null
          doctor_signature: string | null
          doctor_specialization: string | null
          doctor_specialty: string | null
          follow_up_date: string | null
          format_type: string | null
          notes: string | null
          patient_age: number | null
          patient_blood_group: string | null
          patient_dob: string | null
          patient_first_name: string | null
          patient_gender: string | null
          patient_height: number | null
          patient_id: string | null
          patient_last_name: string | null
          patient_weight: number | null
          prescription_date: string | null
          prescription_id: string | null
          prescription_text: string | null
          validity_period: number | null
          vitals: Json | null
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
      doctor_stats: {
        Row: {
          doctor_id: string | null
          medical_records_count: number | null
          patients_count: number | null
          todays_appointments: number | null
          upcoming_appointments: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_assignments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "patient_assignments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_prescriptions"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_assignments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assignments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assignments_doctor_profile_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "registration_progress"
            referencedColumns: ["user_id"]
          },
        ]
      }
      registration_progress: {
        Row: {
          care_team_assigned: boolean | null
          chat_room_created: boolean | null
          chatroom_notification_sent: boolean | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          payment_status: string | null
          registration_completed: boolean | null
          updated_at: string | null
          user_id: string | null
          welcome_notification_sent: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_patient_health_plan_item: {
        Args: {
          p_patient_id: string
          p_type: string
          p_scheduled_time: string
          p_description: string
          p_frequency: string
          p_duration?: string
        }
        Returns: string
      }
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
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      can_access_tasks: {
        Args: { user_id: string }
        Returns: boolean
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
      complete_patient_registration: {
        Args: {
          p_user_id: string
          p_payment_id: string
          p_razorpay_order_id: string
          p_razorpay_payment_id: string
        }
        Returns: Json
      }
      complete_professional_registration: {
        Args: { p_user_id: string; p_phone?: string }
        Returns: Json
      }
      complete_user_registration: {
        Args: {
          p_user_id: string
          p_role: string
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_email?: string
          p_age?: number
          p_gender?: string
          p_blood_group?: string
          p_allergies?: string
          p_emergency_contact?: string
          p_height?: number
          p_birth_date?: string
          p_food_habit?: string
          p_current_medical_conditions?: string
        }
        Returns: Json
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
      create_registration_tasks: {
        Args: { p_user_id: string; p_tasks: Json }
        Returns: string[]
      }
      create_test_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_user_role: {
        Args: {
          p_user_id: string
          p_role: Database["public"]["Enums"]["user_type"]
        }
        Returns: Json
      }
      delete_health_plan_item: {
        Args: { p_item_id: string }
        Returns: boolean
      }
      delete_push_subscription: {
        Args: { p_endpoint: string }
        Returns: boolean
      }
      fix_existing_professional_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_patient_invoice: {
        Args: {
          p_patient_id: string
          p_doctor_id: string
          p_amount: number
          p_description?: string
        }
        Returns: string
      }
      get_active_default_care_team: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          default_doctor_id: string
          default_nutritionist_id: string
          is_active: boolean
          created_at: string
        }[]
      }
      get_admin_clinics_count: {
        Args: Record<PropertyKey, never>
        Returns: number
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
      get_admin_users_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_administrators: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          first_name: string
          last_name: string
        }[]
      }
      get_all_comprehensive_prescriptions: {
        Args: { p_patient_id: string }
        Returns: {
          prescription_id: string
          prescription_date: string
          doctor_name: string
          diagnosis: string
          format_type: string
        }[]
      }
      get_all_patient_prescriptions: {
        Args: { p_patient_id: string }
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
      get_chat_room_members: {
        Args: { p_room_id: string }
        Returns: {
          id: string
          first_name: string
          last_name: string
          role: string
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
      get_comprehensive_prescription: {
        Args: { p_prescription_id: string }
        Returns: {
          prescription_data: Json
          medications: Json
          tests: Json
        }[]
      }
      get_doctor_all_stats: {
        Args: { doctor_id: string }
        Returns: {
          patients_count: number
          medical_records_count: number
          todays_appointments: number
          upcoming_appointments: number
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
      get_doctor_availability: {
        Args: { p_doctor_id: string }
        Returns: {
          id: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
          updated_at: string
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
      get_next_pending_registration_task: {
        Args: Record<PropertyKey, never>
        Returns: {
          task_id: string
          user_id: string
          task_type: string
          retry_count: number
          created_at: string
        }[]
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
      get_patient_habit_logs: {
        Args: { p_user_id: string; p_habit_type?: string }
        Returns: {
          id: string
          habit_id: string
          habit_type: string
          value: number
          date: string
          notes: string
          created_at: string
        }[]
      }
      get_patient_habit_summary: {
        Args: { p_user_id: string }
        Returns: {
          habit_type: string
          avg_value: number
          last_7_days: number[]
          last_date: string
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
      get_patient_invoices: {
        Args: { p_patient_id: string }
        Returns: {
          id: string
          invoice_number: string
          amount: number
          created_at: string
          description: string
          status: string
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
      get_patient_payment_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          patient_id: string
          patient_first_name: string
          patient_last_name: string
          doctor_id: string
          doctor_first_name: string
          doctor_last_name: string
          total_invoices: number
          pending_payments: number
          paid_amount: number
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
      get_prescribed_tests: {
        Args: { p_prescription_id: string }
        Returns: {
          id: string
          test_name: string
          instructions: string
        }[]
      }
      get_prescription_medications: {
        Args: { p_prescription_id: string }
        Returns: {
          id: string
          medication_name: string
          dosage: string
          frequency: string
          duration: string
          timing: string
          instructions: string
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
      get_room_messages_with_role: {
        Args: {
          p_room_id: string
          p_limit?: number
          p_offset?: number
          p_user_role?: string
        }
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
      get_system_status: {
        Args: Record<PropertyKey, never>
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
      get_user_notification_logs: {
        Args: { p_limit?: number; p_offset?: number; p_user_id?: string }
        Returns: {
          id: string
          type: Database["public"]["Enums"]["notification_type"]
          title: string
          body: string
          data: Json
          status: string
          created_at: string
        }[]
      }
      get_user_notification_preferences: {
        Args: { p_user_id?: string }
        Returns: {
          id: string
          health_plan_enabled: boolean
          appointment_enabled: boolean
          medication_enabled: boolean
          general_enabled: boolean
          quiet_hours_start: string
          quiet_hours_end: string
        }[]
      }
      get_user_registration_status: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_registration_status_safe: {
        Args: { p_user_id: string }
        Returns: Json
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
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
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
      log_notification: {
        Args: {
          p_user_id: string
          p_subscription_id: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_title: string
          p_body: string
          p_data?: Json
          p_status?: string
          p_error?: string
        }
        Returns: string
      }
      mark_messages_as_read: {
        Args: { p_user_id: string; p_sender_id: string }
        Returns: boolean
      }
      save_habit_progress_log: {
        Args: {
          p_user_id: string
          p_habit_type: string
          p_value: number
          p_date: string
          p_notes?: string
          p_habit_id?: string
        }
        Returns: string
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
      save_structured_prescription: {
        Args: {
          p_patient_id: string
          p_doctor_id: string
          p_diagnosis: string
          p_notes: string
          p_vitals?: Json
          p_follow_up_date?: string
          p_validity_period?: number
          p_format_type?: string
          p_medications?: Json
          p_tests?: Json
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
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      update_doctor_availability: {
        Args: { p_doctor_id: string; p_availabilities: Json }
        Returns: {
          created_at: string
          day_of_week: number
          doctor_id: string | null
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          updated_at: string
        }[]
      }
      update_notification_preferences: {
        Args: {
          p_health_plan_enabled?: boolean
          p_appointment_enabled?: boolean
          p_medication_enabled?: boolean
          p_general_enabled?: boolean
          p_quiet_hours_start?: string
          p_quiet_hours_end?: string
        }
        Returns: string
      }
      update_registration_task_status: {
        Args: {
          p_task_id: string
          p_status: Database["public"]["Enums"]["task_status"]
          p_result_payload?: Json
          p_error_details?: Json
        }
        Returns: string
      }
      upsert_doctor_details: {
        Args: {
          p_doctor_id: string
          p_registration_number?: string
          p_qualifications?: string
          p_specialization?: string
          p_signature_url?: string
          p_clinic_address?: string
          p_clinic_phone?: string
        }
        Returns: string
      }
      upsert_patient_details: {
        Args: {
          p_user_id: string
          p_age?: number
          p_gender?: string
          p_blood_group?: string
          p_allergies?: string
          p_emergency_contact?: string
          p_height?: number
          p_birth_date?: string
          p_food_habit?: string
          p_current_medical_conditions?: string
        }
        Returns: Json
      }
      upsert_push_subscription: {
        Args: {
          p_endpoint: string
          p_p256dh: string
          p_auth: string
          p_user_agent?: string
        }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
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
      notification_type:
        | "health_plan"
        | "appointment"
        | "medication"
        | "general"
      payment_status: "pending" | "completed" | "failed"
      registration_status:
        | "payment_pending"
        | "payment_complete"
        | "care_team_assigned"
        | "fully_registered"
        | "profile_complete"
        | "notifications_sent"
      reset_method: "email" | "sms"
      resource_type: "pdf" | "video" | "article" | "image"
      task_status: "pending" | "in_progress" | "completed" | "failed"
      user_type:
        | "patient"
        | "doctor"
        | "nutritionist"
        | "administrator"
        | "reception"
        | "aibot"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
      notification_type: [
        "health_plan",
        "appointment",
        "medication",
        "general",
      ],
      payment_status: ["pending", "completed", "failed"],
      registration_status: [
        "payment_pending",
        "payment_complete",
        "care_team_assigned",
        "fully_registered",
        "profile_complete",
        "notifications_sent",
      ],
      reset_method: ["email", "sms"],
      resource_type: ["pdf", "video", "article", "image"],
      task_status: ["pending", "in_progress", "completed", "failed"],
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
