
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, FileText, Database, Code, Network } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsIPad } from "@/hooks/use-mobile";

export const LowLevelDesignDocument = () => {
  const [downloading, setDownloading] = useState(false);
  const isIPad = useIsIPad();

  const handleDownloadPDF = () => {
    setDownloading(true);
    
    // Create a new blob with the content
    const designContent = document.getElementById('designDocumentContent')?.innerText;
    if (!designContent) {
      setDownloading(false);
      return;
    }
    
    const blob = new Blob([designContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link to download the text file
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LowLevelDesign.txt';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Low Level Design Documentation
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 flex items-center gap-2"
          onClick={handleDownloadPDF}
          disabled={downloading}
        >
          <FileDown className="h-4 w-4" />
          {downloading ? "Downloading..." : "Download"}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="schema" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              Database Schema
            </TabsTrigger>
            <TabsTrigger value="functions" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              Functions
            </TabsTrigger>
            <TabsTrigger value="architecture" className="flex items-center gap-1">
              <Network className="h-4 w-4" />
              System Architecture
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className={`${isIPad ? 'h-[60vh]' : 'h-[70vh]'} pr-4`}>
            <div id="designDocumentContent" className="prose max-w-none dark:prose-invert">
              <TabsContent value="overview" className="mt-0">
                <h2>Supabase Low-Level Design</h2>
                
                <h3>Database Schema Overview</h3>
                <p>The database contains multiple interconnected tables for managing a healthcare application with patients, doctors, nutritionists, appointments, medical records, and various communication features.</p>
                
                <h4>Core Tables and Relationships</h4>
                <ol>
                  <li>
                    <strong>Profiles</strong>
                    <ul>
                      <li>Main user information table (linked to auth.users)</li>
                      <li>Contains: <code>id</code>, <code>first_name</code>, <code>last_name</code>, <code>specialty</code>, <code>visiting_hours</code>, <code>clinic_location</code>, <code>consultation_fee</code>, <code>phone</code></li>
                      <li>Used as the central reference for all user types</li>
                    </ul>
                  </li>
                  <li>
                    <strong>User Roles</strong>
                    <ul>
                      <li>Defines the user type (patient, doctor, nutritionist, administrator, reception)</li>
                      <li>Contains: <code>id</code>, <code>user_id</code>, <code>role</code>, <code>created_at</code></li>
                      <li>Primary way to determine user permissions</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Patient Assignments</strong>
                    <ul>
                      <li>Maps patients to their doctors and nutritionists</li>
                      <li>Contains: <code>id</code>, <code>patient_id</code>, <code>doctor_id</code>, <code>nutritionist_id</code>, <code>created_at</code>, <code>updated_at</code></li>
                      <li>Central for care team management</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Medical Records</strong>
                    <ul>
                      <li>Stores patient medical information</li>
                      <li>Contains: <code>id</code>, <code>patient_id</code>, <code>doctor_id</code>, <code>diagnosis</code>, <code>prescription</code>, <code>notes</code>, <code>created_at</code>, <code>updated_at</code></li>
                      <li>Core clinical data repository</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Appointments</strong>
                    <ul>
                      <li>Manages scheduled patient-doctor meetings</li>
                      <li>Contains: <code>id</code>, <code>patient_id</code>, <code>doctor_id</code>, <code>scheduled_at</code>, <code>status</code>, <code>notes</code>, <code>payment_confirmed</code>, <code>created_at</code>, <code>updated_at</code></li>
                      <li>Tracks all appointments and their status</li>
                    </ul>
                  </li>
                </ol>
                
                <h4>Communication System</h4>
                <ol>
                  <li>
                    <strong>Chat Messages</strong>
                    <ul>
                      <li>Direct messages between users</li>
                      <li>Contains: <code>id</code>, <code>sender_id</code>, <code>receiver_id</code>, <code>message</code>, <code>message_type</code>, <code>read</code>, <code>created_at</code></li>
                      <li>For one-to-one communication</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Chat Rooms</strong>
                    <ul>
                      <li>Group chat functionality (primarily for care teams)</li>
                      <li>Contains: <code>id</code>, <code>name</code>, <code>description</code>, <code>room_type</code>, <code>is_active</code>, <code>patient_id</code>, <code>created_at</code>, <code>updated_at</code></li>
                      <li>Enables care team discussions</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Room Members</strong>
                    <ul>
                      <li>Users who belong to chat rooms</li>
                      <li>Contains: <code>id</code>, <code>room_id</code>, <code>user_id</code>, <code>role</code>, <code>is_admin</code>, <code>joined_at</code></li>
                      <li>Tracks who belongs to which rooms</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Room Messages</strong>
                    <ul>
                      <li>Messages sent within chat rooms</li>
                      <li>Contains: <code>id</code>, <code>room_id</code>, <code>sender_id</code>, <code>message</code>, <code>message_type</code>, <code>is_system_message</code>, <code>is_ai_message</code>, <code>read_by</code>, <code>created_at</code></li>
                      <li>Stores all room communications</li>
                    </ul>
                  </li>
                </ol>
                
                <h4>Health Management</h4>
                <ol>
                  <li>
                    <strong>Health Plan Items</strong>
                    <ul>
                      <li>Patient health recommendations and schedule</li>
                      <li>Contains: <code>id</code>, <code>patient_id</code>, <code>nutritionist_id</code>, <code>type</code>, <code>scheduled_time</code>, <code>description</code>, <code>frequency</code>, <code>duration</code>, <code>created_at</code></li>
                      <li>Manages patient care plans</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Habit Progress Logs</strong>
                    <ul>
                      <li>Tracks patient health habits progress</li>
                      <li>Contains: <code>id</code>, <code>user_id</code>, <code>habit_type</code>, <code>habit_id</code>, <code>value</code>, <code>date</code>, <code>notes</code>, <code>created_at</code></li>
                      <li>Monitors health improvements</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Patient Medical Reports</strong>
                    <ul>
                      <li>Uploaded medical documents</li>
                      <li>Contains: <code>id</code>, <code>patient_id</code>, <code>file_name</code>, <code>file_path</code>, <code>file_type</code>, <code>file_size</code>, <code>uploaded_at</code></li>
                      <li>Stores patient medical files</li>
                    </ul>
                  </li>
                </ol>
                
                <h4>Payments System</h4>
                <ol>
                  <li>
                    <strong>Patient Invoices</strong>
                    <ul>
                      <li>Billing information for patients</li>
                      <li>Contains: <code>id</code>, <code>patient_id</code>, <code>doctor_id</code>, <code>amount</code>, <code>currency</code>, <code>invoice_number</code>, <code>status</code>, <code>description</code>, <code>created_at</code>, <code>updated_at</code></li>
                      <li>Manages billing</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Payments</strong>
                    <ul>
                      <li>Payment processing records</li>
                      <li>Contains: <code>id</code>, <code>appointment_id</code>, <code>amount</code>, <code>currency</code>, <code>status</code>, <code>razorpay_order_id</code>, <code>razorpay_payment_id</code>, <code>created_at</code>, <code>updated_at</code></li>
                      <li>Tracks payment transactions</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Payment Settings</strong>
                    <ul>
                      <li>System-wide payment configurations</li>
                      <li>Contains: <code>id</code>, <code>currency</code>, <code>razorpay_key_id</code>, <code>razorpay_webhook_secret</code>, <code>created_at</code>, <code>updated_at</code></li>
                      <li>Controls payment processing options</li>
                    </ul>
                  </li>
                </ol>
                
                <h4>Notifications</h4>
                <ol>
                  <li>
                    <strong>Push Subscriptions</strong>
                    <ul>
                      <li>Web push notification subscriptions</li>
                      <li>Contains: <code>id</code>, <code>user_id</code>, <code>endpoint</code>, <code>p256dh</code>, <code>auth</code>, <code>user_agent</code>, <code>last_used_at</code>, <code>created_at</code>, <code>updated_at</code></li>
                      <li>Enables web push notifications</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Notification Preferences</strong>
                    <ul>
                      <li>User notification settings</li>
                      <li>Contains: <code>id</code>, <code>user_id</code>, <code>health_plan_enabled</code>, <code>appointment_enabled</code>, <code>medication_enabled</code>, <code>general_enabled</code>, <code>quiet_hours_start</code>, <code>quiet_hours_end</code>, <code>created_at</code>, <code>updated_at</code></li>
                      <li>Controls user notification preferences</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Notification Logs</strong>
                    <ul>
                      <li>Record of sent notifications</li>
                      <li>Contains: <code>id</code>, <code>user_id</code>, <code>subscription_id</code>, <code>type</code>, <code>title</code>, <code>body</code>, <code>data</code>, <code>status</code>, <code>error</code>, <code>created_at</code></li>
                      <li>Keeps history of all notifications</li>
                    </ul>
                  </li>
                </ol>

                <h4>Chatbot Knowledge</h4>
                <ol>
                  <li>
                    <strong>Chatbot Knowledge</strong>
                    <ul>
                      <li>Knowledge base for AI chatbot</li>
                      <li>Contains: <code>id</code>, <code>topic</code>, <code>content</code>, <code>created_at</code>, <code>updated_at</code></li>
                      <li>Supports AI assistant functionality</li>
                    </ul>
                  </li>
                </ol>
              </TabsContent>
              
              <TabsContent value="schema" className="mt-0">
                <h2>Database Schema Details</h2>
                
                <h3>Row-Level Security (RLS)</h3>
                <p>The database implements extensive Row-Level Security policies to ensure:</p>
                <ol>
                  <li>Users can only access their own data</li>
                  <li>Doctors can access their patients' data</li>
                  <li>Administrators have broader access to system data</li>
                  <li>Care team members can access shared patient information</li>
                </ol>
                <p>This security system is implemented through RLS policies and security definer functions that enforce appropriate data access.</p>
                
                <h3>Database Views</h3>
                <ol>
                  <li>
                    <strong>care_team_rooms_view</strong>
                    <ul>
                      <li>Simplified view of care team rooms</li>
                      <li>Contains: <code>room_id</code>, <code>room_name</code>, <code>room_description</code>, <code>room_type</code>, <code>patient_id</code>, <code>patient_name</code>, <code>member_count</code>, <code>created_at</code>, <code>last_message</code>, <code>last_message_time</code></li>
                    </ul>
                  </li>
                  <li>
                    <strong>doctor_stats</strong>
                    <ul>
                      <li>Statistics about doctors' patients and appointments</li>
                      <li>Contains: <code>doctor_id</code>, <code>patients_count</code>, <code>medical_records_count</code>, <code>todays_appointments</code>, <code>upcoming_appointments</code></li>
                    </ul>
                  </li>
                  <li>
                    <strong>detailed_payment_reports</strong>
                    <ul>
                      <li>Comprehensive payment information</li>
                      <li>Contains payment details with patient and doctor information</li>
                    </ul>
                  </li>
                  <li>
                    <strong>patient_assignments_report</strong>
                    <ul>
                      <li>Report on patient-care team assignments</li>
                      <li>Shows which doctors and nutritionists are assigned to which patients</li>
                    </ul>
                  </li>
                </ol>
                
                <h3>Primary Key and Foreign Key Relationships</h3>
                <p>All tables use UUID primary keys for secure identification of records. Foreign key relationships maintain data integrity between:</p>
                <ul>
                  <li>Profiles and auth.users (auth_id)</li>
                  <li>User_roles and profiles (user_id)</li>
                  <li>Patient_assignments and profiles (patient_id, doctor_id, nutritionist_id)</li>
                  <li>Medical_records and profiles (patient_id, doctor_id)</li>
                  <li>Appointments and profiles (patient_id, doctor_id)</li>
                  <li>Chat_messages and profiles (sender_id, receiver_id)</li>
                  <li>Chat_rooms and profiles (for patient_id)</li>
                  <li>Room_members and chat_rooms (room_id) and profiles (user_id)</li>
                  <li>Room_messages and chat_rooms (room_id) and profiles (sender_id)</li>
                </ul>
                
                <h3>Indexing Strategy</h3>
                <p>The database uses strategic indexing to optimize query performance:</p>
                <ul>
                  <li>B-tree indexes on all foreign key columns</li>
                  <li>Composite indexes on frequently queried combinations (e.g., patient_id + doctor_id)</li>
                  <li>Date-based indexes on appointment and message timestamps</li>
                  <li>Function-based indexes for case-insensitive searches</li>
                </ul>
                
                <h3>Triggers and Automated Processes</h3>
                <p>Several triggers automate important processes:</p>
                <ol>
                  <li><code>handle_new_user</code> trigger - Creates profile and role entries when a new auth user is created</li>
                  <li><code>create_care_team_room_on_assignment</code> trigger - Automatically creates care team chat rooms when assignments are made</li>
                </ol>
                
                <h3>Enums and Custom Types</h3>
                <p>The database uses several custom types for data consistency:</p>
                <ol>
                  <li><code>user_type</code>: 'patient', 'doctor', 'nutritionist', 'administrator', 'reception'</li>
                  <li><code>appointment_status</code>: 'scheduled', 'completed', 'cancelled', 'no_show'</li>
                  <li><code>message_type</code>: 'text', 'image', 'file', 'video'</li>
                  <li><code>chat_room_type</code>: 'direct', 'care_team', 'group'</li>
                  <li><code>notification_type</code>: 'health_plan', 'appointment', 'medication', 'message', 'general'</li>
                  <li><code>habit_type</code>: 'water', 'sleep', 'exercise', 'nutrition', 'meditation', 'medication', 'custom'</li>
                </ol>

                <h3>Notification System Design</h3>
                <p>The application implements a comprehensive notification system with:</p>
                <ol>
                  <li>Web push notification capabilities</li>
                  <li>User-configurable preferences (types, quiet hours)</li>
                  <li>Multiple delivery channels (in-app, email, WhatsApp)</li>
                  <li>Notification logging for audit purposes</li>
                </ol>
                <p>This technical infrastructure provides a solid foundation for the healthcare application, enabling secure data management, communication, and clinical workflows.</p>
              </TabsContent>
              
              <TabsContent value="functions" className="mt-0">
                <h2>Database Functions and Edge Functions</h2>
                
                <h3>Database Functions</h3>
                <p>The system has numerous database functions including:</p>
                
                <h4>User Management</h4>
                <ul>
                  <li><code>get_user_role</code>: Retrieves a user's role</li>
                  <li><code>check_user_exists</code>: Verifies if a user exists</li>
                  <li><code>get_users_with_roles</code>: Lists all users with their roles</li>
                  <li><code>is_admin</code>: Checks if a user is an administrator</li>
                  <li><code>is_doctor</code>: Checks if a user is a doctor</li>
                  <li><code>is_reception</code>: Checks if a user is reception staff</li>
                  <li><code>has_role</code>: Checks if the current user has a specific role</li>
                  <li><code>get_users_by_role</code>: Gets all users with a given role</li>
                </ul>
                
                <h4>Patient-Doctor Relations</h4>
                <ul>
                  <li><code>assign_doctor_to_patient</code>: Assigns a doctor to a patient</li>
                  <li><code>admin_assign_doctor_to_patient</code>: Admin function to assign doctors</li>
                  <li><code>get_doctor_patients</code>: Lists all patients for a doctor</li>
                  <li><code>get_patient_care_team</code>: Gets all care team members for a patient</li>
                  <li><code>admin_assign_care_team</code>: Assigns complete care team to a patient</li>
                  <li><code>assign_nutritionist_to_patient</code>: Assigns a nutritionist to a patient</li>
                  <li><code>assign_patient_to_nutritionist</code>: Assigns patient from nutritionist perspective</li>
                </ul>
                
                <h4>Medical Records</h4>
                <ul>
                  <li><code>create_medical_record</code>: Creates a new medical record</li>
                  <li><code>get_patient_medical_records</code>: Retrieves records for a patient</li>
                  <li><code>get_patient_prescriptions</code>: Gets prescription history</li>
                  <li><code>get_doctor_patient_records</code>: Gets records for doctor-patient relationship</li>
                  <li><code>save_prescription</code>: Saves a prescription to the medical records</li>
                  <li><code>get_all_patient_prescriptions</code>: Gets all prescriptions for a patient</li>
                  <li><code>get_patient_medical_reports</code>: Gets uploaded medical files for a patient</li>
                  <li><code>get_medical_report_url</code>: Gets the URL for a medical report</li>
                </ul>
                
                <h4>Appointments</h4>
                <ul>
                  <li><code>get_appointments_by_date</code>: Lists appointments for a specific date</li>
                  <li><code>create_appointment</code>: Creates a new appointment</li>
                  <li><code>validate_appointment_date</code>: Checks if a time slot is available</li>
                  <li><code>get_doctor_appointments_with_patients</code>: Gets appointments with patient details</li>
                  <li><code>get_patient_appointments</code>: Gets a patient's appointments</li>
                  <li><code>check_appointment_access</code>: Verifies user can access an appointment</li>
                </ul>
                
                <h4>Messaging</h4>
                <ul>
                  <li><code>send_chat_message</code>: Sends a direct message</li>
                  <li><code>get_user_chat_messages</code>: Gets messages between users</li>
                  <li><code>mark_messages_as_read</code>: Updates read status</li>
                  <li><code>create_care_team_room</code>: Creates a room for care team communication</li>
                  <li><code>get_room_messages</code>: Gets messages in a room</li>
                  <li><code>send_room_message</code>: Sends a message to a room</li>
                  <li><code>get_care_team_messages</code>: Gets messages for a care team</li>
                  <li><code>get_patient_care_team_room</code>: Gets the care team room for a patient</li>
                  <li><code>is_room_member</code>: Checks if a user is in a room</li>
                </ul>
                
                <h4>Notifications</h4>
                <ul>
                  <li><code>upsert_push_subscription</code>: Creates/updates subscription</li>
                  <li><code>log_notification</code>: Logs sent notifications</li>
                  <li><code>get_user_notification_preferences</code>: Gets user preferences</li>
                  <li><code>update_notification_preferences</code>: Updates preferences</li>
                  <li><code>get_user_notification_logs</code>: Gets notification history</li>
                  <li><code>delete_push_subscription</code>: Removes a subscription</li>
                </ul>
                
                <h4>Health Management</h4>
                <ul>
                  <li><code>get_patient_health_plan</code>: Gets health plan items</li>
                  <li><code>save_health_plan_items</code>: Saves health plan items</li>
                  <li><code>add_patient_health_plan_item</code>: Adds a single health plan item</li>
                  <li><code>delete_health_plan_item</code>: Removes a health plan item</li>
                  <li><code>get_patient_habit_logs</code>: Gets habit tracking data</li>
                  <li><code>save_habit_progress_log</code>: Saves habit tracking entry</li>
                  <li><code>get_patient_habit_summary</code>: Gets habit tracking summary</li>
                </ul>
                
                <h4>Payments and Invoicing</h4>
                <ul>
                  <li><code>generate_patient_invoice</code>: Creates a new invoice</li>
                  <li><code>get_patient_invoices</code>: Gets invoices for a patient</li>
                  <li><code>get_patient_payment_summary</code>: Gets payment status overview</li>
                </ul>
                
                <h4>Statistics and Reports</h4>
                <ul>
                  <li><code>get_doctor_patients_count</code>: Counts patients assigned to a doctor</li>
                  <li><code>get_doctor_medical_records_count</code>: Counts medical records by a doctor</li>
                  <li><code>get_doctor_todays_appointments_count</code>: Counts today's appointments</li>
                  <li><code>get_doctor_upcoming_appointments_count</code>: Counts future appointments</li>
                  <li><code>get_doctor_all_stats</code>: Gets complete dashboard stats for doctors</li>
                  <li><code>get_admin_users_count</code>: Counts total system users</li>
                  <li><code>get_admin_clinics_count</code>: Counts clinic locations</li>
                  <li><code>get_system_status</code>: Checks system operational status</li>
                  <li><code>get_patient_assignments_report</code>: Generates care team report</li>
                </ul>
                
                <h3>Edge Functions</h3>
                <p>The application uses Supabase Edge Functions for server-side logic:</p>
                
                <h4>Authentication & User Management</h4>
                <ul>
                  <li><code>admin-delete-user</code>: Removes users from the system</li>
                  <li><code>upsert-user-role</code>: Creates or updates user roles</li>
                  <li><code>upsert-patient-details</code>: Creates or updates patient details</li>
                  <li><code>admin-get-user-roles</code>: Admin function to get user roles</li>
                  <li><code>admin-get-users</code>: Admin function to list users</li>
                  <li><code>verify-users-exist</code>: Validates user existence</li>
                </ul>
                
                <h4>AI and Document Processing</h4>
                <ul>
                  <li><code>analyze-medical-document</code>: Analyzes uploaded medical documents</li>
                  <li><code>doctor-ai-assistant</code>: Provides AI assistance for doctors</li>
                  <li><code>care-team-ai-chat</code>: Enables AI chat for care teams</li>
                  <li><code>bhashini-translate</code>: Translates medical content</li>
                </ul>
                
                <h4>Communications</h4>
                <ul>
                  <li><code>send-ai-care-team-message</code>: Sends AI messages in team chats</li>
                  <li><code>send-chat-message</code>: Handles user-to-user chat</li>
                  <li><code>mark-messages-as-read</code>: Updates read status</li>
                  <li><code>sync-care-team-rooms</code>: Configures care team rooms</li>
                  <li><code>get-chat-messages</code>: Retrieves chat history</li>
                  <li><code>get-patient-care-team-room</code>: Gets care team room for patient</li>
                  <li><code>fix-doctor-room-access</code>: Repairs permission issues</li>
                  <li><code>list-chat-rooms</code>: Lists available chat rooms</li>
                </ul>
                
                <h4>Notifications</h4>
                <ul>
                  <li><code>send-health-plan-notification</code>: Notifies about health plans</li>
                  <li><code>send-health-plan-reminders</code>: Sends reminder notifications</li>
                  <li><code>send-push-notification</code>: Handles web push notifications</li>
                  <li><code>send-invoice-notification</code>: Notifies about new invoices</li>
                  <li><code>send-whatsapp-notification</code>: Sends WhatsApp messages</li>
                  <li><code>assign-nutritionist-notification</code>: Notifications for team changes</li>
                  <li><code>get-vapid-public-key</code>: Gets notification keys</li>
                </ul>
                
                <h4>Payments</h4>
                <ul>
                  <li><code>create-razorpay-order</code>: Creates payment orders</li>
                  <li><code>verify-razorpay-payment</code>: Verifies payment completion</li>
                  <li><code>generate-patient-invoice</code>: Creates patient invoices</li>
                  <li><code>get-patient-payment-summary</code>: Gets payment status overview</li>
                  <li><code>view-invoice</code>: Generates invoice view</li>
                </ul>
                
                <h4>Data Access & Retrieval</h4>
                <ul>
                  <li><code>get-doctor-for-patient</code>: Gets assigned doctor</li>
                  <li><code>get-nutritionist-for-patient</code>: Gets assigned nutritionist</li>
                  <li><code>get-assigned-patients</code>: Gets patient assignments</li>
                  <li><code>get-doctor-patients</code>: Lists patients for a doctor</li>
                  <li><code>get-doctor-stats</code>: Gets doctor dashboard stats</li>
                  <li><code>get-medical-report-url</code>: Generates secure file URLs</li>
                  <li><code>get-patient-profile</code>: Gets patient information</li>
                  <li><code>get-nutritionist-patients</code>: Lists patients for nutritionist</li>
                </ul>
                
                <h4>System Management</h4>
                <ul>
                  <li><code>create-test-data</code>: Generates test data</li>
                </ul>
              </TabsContent>
              
              <TabsContent value="architecture" className="mt-0">
                <h2>System Architecture</h2>
                
                <h3>Infrastructure Components</h3>
                <p>The healthcare application uses a modern serverless architecture built on:</p>
                <ol>
                  <li><strong>Supabase</strong> - Backend as a Service (BaaS) platform providing:
                    <ul>
                      <li>PostgreSQL database for data storage</li>
                      <li>Authentication system with email/password, magic link, and social login</li>
                      <li>Storage for file uploads like medical reports</li>
                      <li>Real-time subscriptions for chat and notifications</li>
                      <li>Edge Functions for serverless compute</li>
                    </ul>
                  </li>
                  <li><strong>React</strong> - Frontend framework for responsive web application
                    <ul>
                      <li>SPA (Single Page Application) architecture</li>
                      <li>Client-side routing</li>
                      <li>Component-based architecture</li>
                    </ul>
                  </li>
                  <li><strong>Tailwind CSS</strong> - Utility-first CSS framework
                    <ul>
                      <li>Responsive design approach</li>
                      <li>Custom themed components</li>
                    </ul>
                  </li>
                  <li><strong>Serverless Functions</strong> - Business logic execution
                    <ul>
                      <li>Supabase Edge Functions (built on Deno)</li>
                      <li>Integration with external APIs (Razorpay, WhatsApp, etc.)</li>
                    </ul>
                  </li>
                </ol>
                
                <h3>Security Architecture</h3>
                <p>The application implements multiple layers of security:</p>
                <ol>
                  <li><strong>Authentication</strong>
                    <ul>
                      <li>JWT-based access tokens</li>
                      <li>Secure password storage with bcrypt</li>
                      <li>Role-based user system</li>
                    </ul>
                  </li>
                  <li><strong>Authorization</strong>
                    <ul>
                      <li>Row-Level Security (RLS) in the database</li>
                      <li>Role-specific access to database functions</li>
                      <li>Secure function calling patterns</li>
                    </ul>
                  </li>
                  <li><strong>Data Protection</strong>
                    <ul>
                      <li>Encrypted connections (TLS/SSL)</li>
                      <li>Restricted file access with signed URLs</li>
                      <li>Limited exposure of sensitive data</li>
                    </ul>
                  </li>
                </ol>
                
                <h3>Data Flow</h3>
                <p>The system uses a structured approach to data flow:</p>
                <ol>
                  <li><strong>User-to-Database</strong>
                    <ul>
                      <li>Client requests authenticated through JWT tokens</li>
                      <li>RLS policies enforce access restrictions</li>
                      <li>Security definer functions encapsulate business logic</li>
                    </ul>
                  </li>
                  <li><strong>Real-time Updates</strong>
                    <ul>
                      <li>PostgreSQL LISTEN/NOTIFY mechanism</li>
                      <li>WebSocket connections for live updates</li>
                      <li>Publication/subscription model for changes</li>
                    </ul>
                  </li>
                  <li><strong>External Integrations</strong>
                    <ul>
                      <li>Serverless functions for third-party service calls</li>
                      <li>Webhook endpoints for asynchronous events</li>
                      <li>API gateways for secure external communications</li>
                    </ul>
                  </li>
                </ol>
                
                <h3>Scalability Considerations</h3>
                <p>The architecture is designed for growth with these principles:</p>
                <ol>
                  <li><strong>Horizontal Scaling</strong>
                    <ul>
                      <li>Stateless application design</li>
                      <li>Connection pooling for database efficiency</li>
                      <li>Distributed computing with edge functions</li>
                    </ul>
                  </li>
                  <li><strong>Performance Optimization</strong>
                    <ul>
                      <li>Efficient database indexing strategy</li>
                      <li>Query optimization through views and functions</li>
                      <li>Caching of frequently accessed data</li>
                    </ul>
                  </li>
                  <li><strong>Resource Management</strong>
                    <ul>
                      <li>Database connection limitations</li>
                      <li>Rate limiting on API endpoints</li>
                      <li>Background job processing for heavy tasks</li>
                    </ul>
                  </li>
                </ol>
                
                <h3>Design Patterns</h3>
                <p>Several software design patterns are employed:</p>
                <ol>
                  <li><strong>Repository Pattern</strong> - Database access is abstracted through functions</li>
                  <li><strong>Observer Pattern</strong> - Event-driven architecture for real-time features</li>
                  <li><strong>Factory Pattern</strong> - Creation of complex objects like notifications</li>
                  <li><strong>Facade Pattern</strong> - Simplified interfaces to complex subsystems</li>
                  <li><strong>Command Pattern</strong> - Encapsulation of requests as objects</li>
                </ol>
                
                <p>This technical infrastructure provides a solid foundation for the healthcare application, enabling secure data management, communication, and clinical workflows.</p>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
        
        <Alert className="mt-4 bg-gray-50">
          <AlertDescription>
            This documentation provides a comprehensive overview of the database schema, functions, and edge functions used in the application. You can download this document for offline reference.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
