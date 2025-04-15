
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
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>first_name</code> (Text), <code>last_name</code> (Text), <code>specialty</code> (Text), <code>visiting_hours</code> (Text), <code>clinic_location</code> (Text), <code>consultation_fee</code> (Numeric, Default: 500.00), <code>phone</code> (Text), <code>created_at</code> (Timestamp), <code>updated_at</code> (Timestamp)</li>
                      <li>Foreign key relationship with auth.users (id)</li>
                      <li>Used as the central reference for all user types</li>
                    </ul>
                  </li>
                  <li>
                    <strong>User Roles</strong>
                    <ul>
                      <li>Defines the user type (patient, doctor, nutritionist, administrator, reception)</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>user_id</code> (UUID), <code>role</code> (user_type ENUM), <code>created_at</code> (Timestamp)</li>
                      <li>Foreign key to profiles (user_id)</li>
                      <li>Primary way to determine user permissions</li>
                      <li>Enum type <code>user_type</code> with values: 'patient', 'doctor', 'nutritionist', 'administrator', 'reception'</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Patient Assignments</strong>
                    <ul>
                      <li>Maps patients to their doctors and nutritionists</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>patient_id</code> (UUID), <code>doctor_id</code> (UUID), <code>nutritionist_id</code> (UUID), <code>created_at</code> (Timestamp), <code>updated_at</code> (Timestamp)</li>
                      <li>Foreign keys to profiles (patient_id, doctor_id, nutritionist_id)</li>
                      <li>Unique constraint on (patient_id, doctor_id) pair</li>
                      <li>Central for care team management</li>
                      <li>Automatically creates care team rooms via trigger</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Medical Records</strong>
                    <ul>
                      <li>Stores patient medical information</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>patient_id</code> (UUID), <code>doctor_id</code> (UUID), <code>diagnosis</code> (Text), <code>prescription</code> (Text), <code>notes</code> (Text), <code>created_at</code> (Timestamp), <code>updated_at</code> (Timestamp)</li>
                      <li>Foreign keys to profiles (patient_id, doctor_id)</li>
                      <li>Core clinical data repository</li>
                      <li>Used for prescriptions, diagnoses, and clinical notes</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Appointments</strong>
                    <ul>
                      <li>Manages scheduled patient-doctor meetings</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>patient_id</code> (UUID), <code>doctor_id</code> (UUID), <code>scheduled_at</code> (Timestamp), <code>status</code> (appointment_status ENUM), <code>notes</code> (Text), <code>payment_confirmed</code> (Boolean), <code>email_notification_sent</code> (Boolean), <code>whatsapp_notification_sent</code> (Boolean), <code>created_at</code> (Timestamp), <code>updated_at</code> (Timestamp)</li>
                      <li>Foreign keys to profiles (patient_id, doctor_id)</li>
                      <li>Enum type <code>appointment_status</code> with values: 'scheduled', 'completed', 'cancelled', 'no_show'</li>
                      <li>Tracks all appointments and their status</li>
                      <li>Linked to payments table via appointment_id</li>
                    </ul>
                  </li>
                </ol>
                
                <h4>Communication System</h4>
                <ol>
                  <li>
                    <strong>Chat Messages</strong>
                    <ul>
                      <li>Direct messages between users</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>sender_id</code> (UUID), <code>receiver_id</code> (UUID), <code>message</code> (Text), <code>message_type</code> (message_type ENUM), <code>read</code> (Boolean), <code>file_url</code> (Text), <code>created_at</code> (Timestamp)</li>
                      <li>Foreign keys to profiles (sender_id, receiver_id)</li>
                      <li>Enum type <code>message_type</code> with values: 'text', 'image', 'file', 'video'</li>
                      <li>For one-to-one communication</li>
                      <li>Indexed on sender_id, receiver_id, and created_at for efficient queries</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Chat Rooms</strong>
                    <ul>
                      <li>Group chat functionality (primarily for care teams)</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>name</code> (Text), <code>description</code> (Text), <code>room_type</code> (chat_room_type ENUM), <code>is_active</code> (Boolean), <code>patient_id</code> (UUID), <code>created_at</code> (Timestamp), <code>updated_at</code> (Timestamp)</li>
                      <li>Foreign key to profiles (patient_id)</li>
                      <li>Enum type <code>chat_room_type</code> with values: 'direct', 'care_team', 'group'</li>
                      <li>Enables care team discussions</li>
                      <li>Used for team-based chat functionality</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Room Members</strong>
                    <ul>
                      <li>Users who belong to chat rooms</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>room_id</code> (UUID), <code>user_id</code> (UUID), <code>role</code> (Text), <code>is_admin</code> (Boolean), <code>joined_at</code> (Timestamp)</li>
                      <li>Foreign keys to chat_rooms (room_id) and profiles (user_id)</li>
                      <li>Tracks who belongs to which rooms</li>
                      <li>Used to manage access to room conversations</li>
                      <li>Composite index on (room_id, user_id) for efficient lookups</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Room Messages</strong>
                    <ul>
                      <li>Messages sent within chat rooms</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>room_id</code> (UUID), <code>sender_id</code> (UUID), <code>message</code> (Text), <code>message_type</code> (Text), <code>is_system_message</code> (Boolean), <code>is_ai_message</code> (Boolean), <code>read_by</code> (JSONB Array), <code>created_at</code> (Timestamp)</li>
                      <li>Foreign keys to chat_rooms (room_id) and profiles (sender_id)</li>
                      <li>Stores all room communications</li>
                      <li>JSONB read_by array tracks which users have read messages</li>
                      <li>Indexed on room_id and created_at for chronological fetching</li>
                    </ul>
                  </li>
                </ol>
                
                <h4>Health Management</h4>
                <ol>
                  <li>
                    <strong>Health Plan Items</strong>
                    <ul>
                      <li>Patient health recommendations and schedule</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>patient_id</code> (UUID), <code>nutritionist_id</code> (UUID), <code>type</code> (Text), <code>scheduled_time</code> (Text), <code>description</code> (Text), <code>frequency</code> (Text), <code>duration</code> (Text), <code>created_at</code> (Timestamp)</li>
                      <li>Foreign keys to profiles (patient_id, nutritionist_id)</li>
                      <li>Manages patient care plans</li>
                      <li>Used for dietary, medication, and exercise schedules</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Habit Progress Logs</strong>
                    <ul>
                      <li>Tracks patient health habits progress</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>user_id</code> (UUID), <code>habit_type</code> (habit_type ENUM), <code>habit_id</code> (UUID), <code>value</code> (Numeric), <code>date</code> (Date), <code>notes</code> (Text), <code>created_at</code> (Timestamp)</li>
                      <li>Foreign key to profiles (user_id)</li>
                      <li>Enum type <code>habit_type</code> with values: 'water', 'sleep', 'exercise', 'nutrition', 'meditation', 'medication', 'custom'</li>
                      <li>Monitors health improvements</li>
                      <li>Used for tracking daily health activities</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Patient Medical Reports</strong>
                    <ul>
                      <li>Uploaded medical documents</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>patient_id</code> (UUID), <code>file_name</code> (Text), <code>file_path</code> (Text), <code>file_type</code> (Text), <code>file_size</code> (Integer), <code>uploaded_at</code> (Timestamp)</li>
                      <li>Foreign key to profiles (patient_id)</li>
                      <li>Stores patient medical files</li>
                      <li>Includes lab reports, scan results, and other medical documents</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Analyzed Documents</strong>
                    <ul>
                      <li>AI-analyzed medical documents</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>doctor_id</code> (UUID), <code>original_filename</code> (Text), <code>file_path</code> (Text), <code>file_type</code> (Text), <code>file_size</code> (Bigint), <code>analysis_text</code> (Text), <code>created_at</code> (Timestamp), <code>updated_at</code> (Timestamp)</li>
                      <li>Foreign key to profiles (doctor_id)</li>
                      <li>Stores AI analysis results of medical documents</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Document Summaries</strong>
                    <ul>
                      <li>Summaries of analyzed documents</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>document_id</code> (UUID), <code>summary</code> (Text), <code>created_at</code> (Timestamp)</li>
                      <li>Foreign key to analyzed_documents (document_id)</li>
                      <li>Stores concise summaries of medical reports</li>
                    </ul>
                  </li>
                </ol>
                
                <h4>Payments System</h4>
                <ol>
                  <li>
                    <strong>Patient Invoices</strong>
                    <ul>
                      <li>Billing information for patients</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>patient_id</code> (UUID), <code>doctor_id</code> (UUID), <code>amount</code> (Numeric), <code>currency</code> (Text, Default: 'INR'), <code>invoice_number</code> (Text), <code>status</code> (Text, Default: 'unpaid'), <code>description</code> (Text), <code>razorpay_order_id</code> (Text), <code>payment_id</code> (Text), <code>email_sent</code> (Boolean), <code>whatsapp_sent</code> (Boolean), <code>created_at</code> (Timestamp), <code>updated_at</code> (Timestamp)</li>
                      <li>Foreign keys to profiles (patient_id, doctor_id)</li>
                      <li>Manages billing</li>
                      <li>Linked to payment processing system</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Payments</strong>
                    <ul>
                      <li>Payment processing records</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>appointment_id</code> (UUID), <code>amount</code> (Numeric), <code>currency</code> (Text, Default: 'INR'), <code>status</code> (payment_status ENUM, Default: 'pending'), <code>razorpay_order_id</code> (Text), <code>razorpay_payment_id</code> (Text), <code>created_at</code> (Timestamp), <code>updated_at</code> (Timestamp)</li>
                      <li>Foreign key to appointments (appointment_id)</li>
                      <li>Enum type <code>payment_status</code> with values: 'pending', 'completed', 'failed', 'refunded'</li>
                      <li>Tracks payment transactions</li>
                      <li>Used for payment verification and reconciliation</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Payment Settings</strong>
                    <ul>
                      <li>System-wide payment configurations</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>currency</code> (Text, Default: 'INR'), <code>consultation_fee</code> (Numeric, Default: 500.00), <code>created_at</code> (Timestamp), <code>updated_at</code> (Timestamp)</li>
                      <li>Controls payment processing options</li>
                      <li>Used for system-wide payment defaults</li>
                    </ul>
                  </li>
                </ol>
                
                <h4>Notifications</h4>
                <ol>
                  <li>
                    <strong>Push Subscriptions</strong>
                    <ul>
                      <li>Web push notification subscriptions</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>user_id</code> (UUID), <code>endpoint</code> (Text), <code>p256dh</code> (Text), <code>auth</code> (Text), <code>user_agent</code> (Text), <code>last_used_at</code> (Timestamp), <code>created_at</code> (Timestamp), <code>updated_at</code> (Timestamp)</li>
                      <li>Foreign key to profiles (user_id)</li>
                      <li>Enables web push notifications</li>
                      <li>Stores browser subscription information</li>
                      <li>Unique constraint on (user_id, endpoint)</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Notification Preferences</strong>
                    <ul>
                      <li>User notification settings</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>user_id</code> (UUID), <code>health_plan_enabled</code> (Boolean, Default: true), <code>appointment_enabled</code> (Boolean, Default: true), <code>medication_enabled</code> (Boolean, Default: true), <code>general_enabled</code> (Boolean, Default: true), <code>quiet_hours_start</code> (Time), <code>quiet_hours_end</code> (Time), <code>created_at</code> (Timestamp), <code>updated_at</code> (Timestamp)</li>
                      <li>Foreign key to profiles (user_id)</li>
                      <li>Controls user notification preferences</li>
                      <li>Unique constraint on user_id</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Notification Logs</strong>
                    <ul>
                      <li>Record of sent notifications</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>user_id</code> (UUID), <code>subscription_id</code> (UUID), <code>type</code> (notification_type ENUM), <code>title</code> (Text), <code>body</code> (Text), <code>data</code> (JSONB), <code>status</code> (Text), <code>error</code> (Text), <code>created_at</code> (Timestamp)</li>
                      <li>Foreign keys to profiles (user_id) and push_subscriptions (subscription_id)</li>
                      <li>Enum type <code>notification_type</code> with values: 'health_plan', 'appointment', 'medication', 'message', 'general'</li>
                      <li>Keeps history of all notifications</li>
                      <li>Used for auditing and troubleshooting</li>
                    </ul>
                  </li>
                </ol>

                <h4>Educational Resources</h4>
                <ol>
                  <li>
                    <strong>Knowledge Videos</strong>
                    <ul>
                      <li>Educational video content</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>title</code> (Text), <code>description</code> (Text), <code>video_path</code> (Text), <code>uploaded_by</code> (UUID), <code>uploader_role</code> (user_type ENUM), <code>created_at</code> (Timestamp), <code>updated_at</code> (Timestamp)</li>
                      <li>Foreign key to profiles (uploaded_by)</li>
                      <li>Stores educational videos for patients and medical staff</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Educational Resources</strong>
                    <ul>
                      <li>General educational materials</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>title</code> (Text), <code>description</code> (Text), <code>file_url</code> (Text), <code>resource_type</code> (resource_type ENUM), <code>uploaded_by</code> (UUID), <code>created_at</code> (Timestamp)</li>
                      <li>Foreign key to profiles (uploaded_by)</li>
                      <li>Enum type <code>resource_type</code> with values: 'pdf', 'video', 'audio', 'image', 'link'</li>
                      <li>Stores various educational materials</li>
                    </ul>
                  </li>
                </ol>

                <h4>Chatbot Knowledge</h4>
                <ol>
                  <li>
                    <strong>Chatbot Knowledge</strong>
                    <ul>
                      <li>Knowledge base for AI chatbot</li>
                      <li>Contains: <code>id</code> (UUID, Primary Key), <code>topic</code> (Text), <code>content</code> (JSONB), <code>created_at</code> (Timestamp), <code>updated_at</code> (Timestamp)</li>
                      <li>Supports AI assistant functionality</li>
                      <li>Stores structured medical knowledge</li>
                      <li>Used by the AI chatbot for accurate responses</li>
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
                
                <h4>RLS Policy Examples</h4>
                <ul>
                  <li>
                    <strong>Profiles Table</strong>
                    <ul>
                      <li><code>Enable read access for authenticated users</code> - Allows users to see their own profiles</li>
                      <li><code>Enable update for users based on user_id</code> - Users can update only their own profiles</li>
                      <li><code>Enable read access for patients to their doctor's profiles</code> - Patients can view assigned doctors</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Medical Records Table</strong>
                    <ul>
                      <li><code>Doctors can view their created records</code> - Doctors see records they created</li>
                      <li><code>Patients can view their own records</code> - Patients see only their records</li>
                      <li><code>Admins can view all records</code> - Administrative access to all records</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Chat Messages Table</strong>
                    <ul>
                      <li><code>Users can view messages they sent or received</code> - Message privacy</li>
                      <li><code>Users can insert messages</code> - Ability to send messages</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Chat Rooms Table</strong>
                    <ul>
                      <li><code>Room members can view their rooms</code> - View rooms user belongs to</li>
                      <li><code>Room admins can update rooms</code> - Admins can modify room settings</li>
                    </ul>
                  </li>
                </ul>

                <h3>Database Views</h3>
                <ol>
                  <li>
                    <strong>care_team_rooms_view</strong>
                    <ul>
                      <li>SQL: <code>SELECT r.id as room_id, r.name as room_name, r.description as room_description, r.room_type, r.patient_id, CONCAT(p.first_name, ' ', p.last_name) as patient_name, (SELECT COUNT(*) FROM room_members rm WHERE rm.room_id = r.id) as member_count, r.created_at, (SELECT message FROM room_messages rm WHERE rm.room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message, (SELECT created_at FROM room_messages rm WHERE rm.room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message_time FROM chat_rooms r LEFT JOIN profiles p ON r.patient_id = p.id WHERE r.room_type = 'care_team'</code></li>
                      <li>Simplified view of care team rooms</li>
                      <li>Contains: <code>room_id</code>, <code>room_name</code>, <code>room_description</code>, <code>room_type</code>, <code>patient_id</code>, <code>patient_name</code>, <code>member_count</code>, <code>created_at</code>, <code>last_message</code>, <code>last_message_time</code></li>
                      <li>Used for displaying room information with latest message</li>
                    </ul>
                  </li>
                  <li>
                    <strong>doctor_stats</strong>
                    <ul>
                      <li>SQL: <code>SELECT d.id as doctor_id, (SELECT COUNT(*) FROM patient_assignments pa WHERE pa.doctor_id = d.id) as patients_count, (SELECT COUNT(*) FROM medical_records mr WHERE mr.doctor_id = d.id) as medical_records_count, (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.id AND a.status = 'scheduled' AND TO_CHAR(a.scheduled_at, 'YYYY-MM-DD') = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')) as todays_appointments, (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.id AND a.status = 'scheduled' AND a.scheduled_at {'>'}  (CURRENT_DATE + INTERVAL '1 day')::DATE) as upcoming_appointments FROM profiles d JOIN user_roles ur ON d.id = ur.user_id WHERE ur.role = 'doctor'</code></li>
                      <li>Statistics about doctors' patients and appointments</li>
                      <li>Contains: <code>doctor_id</code>, <code>patients_count</code>, <code>medical_records_count</code>, <code>todays_appointments</code>, <code>upcoming_appointments</code></li>
                      <li>Used for doctor dashboard statistics</li>
                    </ul>
                  </li>
                  <li>
                    <strong>detailed_payment_reports</strong>
                    <ul>
                      <li>SQL: <code>SELECT p.id as payment_id, p.amount, p.status, p.currency, p.razorpay_order_id, p.razorpay_payment_id, a.scheduled_at as appointment_date, p.created_at as payment_date, CONCAT(pat.first_name, ' ', pat.last_name) as patient_first_name, CONCAT(doc.first_name, ' ', doc.last_name) as doctor_first_name FROM payments p JOIN appointments a ON p.appointment_id = a.id JOIN profiles pat ON a.patient_id = pat.id JOIN profiles doc ON a.doctor_id = doc.id</code></li>
                      <li>Comprehensive payment information</li>
                      <li>Contains payment details with patient and doctor information</li>
                      <li>Used for financial reporting</li>
                    </ul>
                  </li>
                  <li>
                    <strong>patient_assignments_report</strong>
                    <ul>
                      <li>SQL: <code>SELECT p.id as patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name, pa.doctor_id, doc.first_name as doctor_first_name, doc.last_name as doctor_last_name, pa.nutritionist_id, nut.first_name as nutritionist_first_name, nut.last_name as nutritionist_last_name FROM profiles p JOIN user_roles ur ON p.id = ur.user_id LEFT JOIN patient_assignments pa ON p.id = pa.patient_id LEFT JOIN profiles doc ON pa.doctor_id = doc.id LEFT JOIN profiles nut ON pa.nutritionist_id = nut.id WHERE ur.role = 'patient'</code></li>
                      <li>Report on patient-care team assignments</li>
                      <li>Shows which doctors and nutritionists are assigned to which patients</li>
                      <li>Used for administrative oversight of care team assignments</li>
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
                  <li>Health_plan_items and profiles (patient_id, nutritionist_id)</li>
                  <li>Patient_medical_reports and profiles (patient_id)</li>
                  <li>Payments and appointments (appointment_id)</li>
                  <li>Patient_invoices and profiles (patient_id, doctor_id)</li>
                  <li>Push_subscriptions and profiles (user_id)</li>
                  <li>Notification_logs and profiles (user_id)</li>
                  <li>Analyzed_documents and profiles (doctor_id)</li>
                  <li>Document_summaries and analyzed_documents (document_id)</li>
                </ul>
                
                <h3>Indexing Strategy</h3>
                <p>The database uses strategic indexing to optimize query performance:</p>
                <ul>
                  <li>B-tree indexes on all foreign key columns</li>
                  <li>Composite indexes on frequently queried combinations (e.g., patient_id + doctor_id)</li>
                  <li>Date-based indexes on appointment and message timestamps</li>
                  <li>Function-based indexes for case-insensitive searches</li>
                  <li>GIN indexes on JSONB columns for efficient searches</li>
                  <li>Specific indexes:</li>
                  <ul>
                    <li>Appointments: (doctor_id, scheduled_at) for efficient doctor schedule queries</li>
                    <li>Chat_messages: (sender_id, receiver_id, created_at) for conversation retrieval</li>
                    <li>Room_messages: (room_id, created_at) for efficient message timeline retrieval</li>
                    <li>Profiles: (first_name, last_name) for name searches</li>
                    <li>Health_plan_items: (patient_id, scheduled_time) for patient schedule queries</li>
                    <li>Push_subscriptions: (user_id, last_used_at) for active subscription queries</li>
                  </ul>
                </ul>
                
                <h3>Triggers and Automated Processes</h3>
                <p>Several triggers automate important processes:</p>
                <ol>
                  <li><code>handle_new_user</code> trigger - Creates profile and role entries when a new auth user is created</li>
                  <li><code>create_care_team_room_on_assignment</code> trigger - Automatically creates care team chat rooms when assignments are made</li>
                  <li><code>update_room_last_activity</code> trigger - Updates room activity timestamp when new messages are added</li>
                  <li><code>log_medical_record_changes</code> trigger - Maintains audit trail for medical record changes</li>
                  <li><code>notify_appointment_changes</code> trigger - Sends notifications when appointment status changes</li>
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
                  <li><code>payment_status</code>: 'pending', 'completed', 'failed', 'refunded'</li>
                  <li><code>resource_type</code>: 'pdf', 'video', 'audio', 'image', 'link'</li>
                </ol>

                <h3>Notification System Design</h3>
                <p>The application implements a comprehensive notification system with:</p>
                <ol>
                  <li>Web push notification capabilities</li>
                  <li>User-configurable preferences (types, quiet hours)</li>
                  <li>Multiple delivery channels (in-app, email, WhatsApp)</li>
                  <li>Notification logging for audit purposes</li>
                  <li>Token management for web push subscriptions</li>
                  <li>Support for silent and visible notifications</li>
                  <li>Delivery time optimization based on user preferences</li>
                </ol>
                <p>This technical infrastructure provides a solid foundation for the healthcare application, enabling secure data management, communication, and clinical workflows.</p>
              </TabsContent>
              
              <TabsContent value="functions" className="mt-0">
                <h2>Database Functions and Edge Functions</h2>
                
                <h3>Database Functions</h3>
                <p>The system has numerous database functions including:</p>
                
                <h4>User Management</h4>
                <ul>
                  <li><code>get_user_role(lookup_user_id UUID)</code>: Retrieves a user's role</li>
                  <li><code>check_user_exists(p_email TEXT)</code>: Verifies if a user exists</li>
                  <li><code>get_users_with_roles()</code>: Lists all users with their roles</li>
                  <li><code>is_admin(user_id UUID)</code>: Checks if a user is an administrator</li>
                  <li><code>is_doctor(user_id UUID)</code>: Checks if a user is a doctor</li>
                  <li><code>is_reception(user_id UUID)</code>: Checks if a user is reception staff</li>
                  <li><code>has_role(role_to_check user_type)</code>: Checks if the current user has a specific role</li>
                  <li><code>get_users_by_role(role_name user_type)</code>: Gets all users with a given role</li>
                  <li><code>check_admin_role(user_id UUID)</code>: Verifies administrator role for a user</li>
                  <li><code>is_admin_user()</code>: Checks if current user is an administrator</li>
                  <li><code>check_user_role_access()</code>: Safely checks user existence to avoid recursion</li>
                  <li><code>is_current_user_admin_fixed()</code>: Safe administrator check to avoid recursion</li>
                </ul>
                
                <h4>Patient-Doctor Relations</h4>
                <ul>
                  <li><code>assign_doctor_to_patient(p_patient_id UUID, p_doctor_id UUID)</code>: Assigns a doctor to a patient</li>
                  <li><code>admin_assign_doctor_to_patient(p_doctor_id UUID, p_patient_id UUID, p_admin_id UUID)</code>: Admin function to assign doctors</li>
                  <li><code>get_doctor_patients(p_doctor_id UUID)</code>: Lists all patients for a doctor</li>
                  <li><code>get_patient_care_team(p_patient_id UUID)</code>: Gets all care team members for a patient</li>
                  <li><code>admin_assign_care_team(p_patient_id UUID, p_doctor_id UUID, p_nutritionist_id UUID, p_admin_id UUID)</code>: Assigns complete care team to a patient</li>
                  <li><code>assign_nutritionist_to_patient(p_patient_id UUID, p_nutritionist_id UUID)</code>: Assigns a nutritionist to a patient</li>
                  <li><code>admin_assign_nutritionist_to_patient(p_nutritionist_id UUID, p_patient_id UUID, p_admin_id UUID)</code>: Admin function to assign nutritionists</li>
                  <li><code>assign_patient_to_nutritionist(p_patient_id UUID, p_nutritionist_id UUID, p_doctor_id UUID)</code>: Assigns patient from nutritionist perspective</li>
                  <li><code>get_nutritionist_patients(p_nutritionist_id UUID)</code>: Gets all patients assigned to a nutritionist</li>
                  <li><code>get_patient_care_team_members(p_patient_id UUID)</code>: Lists all care team members for a patient</li>
                  <li><code>get_patient_doctor_assignments()</code>: Gets all patient-doctor assignments</li>
                  <li><code>get_patient_nutritionist_assignments()</code>: Gets all patient-nutritionist assignments</li>
                </ul>
                
                <h4>Medical Records</h4>
                <ul>
                  <li><code>create_medical_record(p_patient_id UUID, p_doctor_id UUID, p_diagnosis TEXT, p_prescription TEXT, p_notes TEXT)</code>: Creates a new medical record</li>
                  <li><code>get_patient_medical_records(p_patient_id UUID, p_doctor_id UUID)</code>: Retrieves records for a patient</li>
                  <li><code>get_patient_prescriptions(p_patient_id UUID, p_doctor_id UUID)</code>: Gets prescription history</li>
                  <li><code>get_doctor_patient_records(p_doctor_id UUID, p_patient_id UUID)</code>: Gets records for doctor-patient relationship</li>
                  <li><code>save_prescription(p_patient_id UUID, p_doctor_id UUID, p_diagnosis TEXT, p_prescription TEXT, p_notes TEXT)</code>: Saves a new prescription</li>
                </ul>
              </TabsContent>
              
              <TabsContent value="architecture" className="mt-0">
                <h2>System Architecture</h2>
                
                <h3>Authentication and Authorization</h3>
                <p>The system uses Supabase Authentication with custom JWT claims for role-based access control:</p>
                <ul>
                  <li>JWT tokens contain user role information for client-side role checks</li>
                  <li>Row-Level Security enforces data access rules at the database level</li>
                  <li>Security-definer functions provide controlled access to sensitive operations</li>
                  <li>Webhook triggers automatically create user profiles on signup</li>
                </ul>
                
                <h3>Realtime Communication</h3>
                <p>The application leverages Supabase Realtime for instant updates:</p>
                <ul>
                  <li>Chat messages use broadcast channels for instant delivery</li>
                  <li>Appointment updates trigger realtime notifications</li>
                  <li>Medical record changes are synchronized across devices</li>
                  <li>Realtime presence tracking for online status</li>
                </ul>
                
                <h3>Storage and Media Handling</h3>
                <p>The application uses Supabase Storage for file management:</p>
                <ul>
                  <li>Secure medical document storage with access controls</li>
                  <li>Image optimization for profile pictures and medical images</li>
                  <li>Automated cleanup of temporary files</li>
                  <li>Content-type validation for security</li>
                </ul>
                
                <h3>Edge Functions</h3>
                <p>The system uses Edge Functions for specialized processing:</p>
                <ul>
                  <li>Document analysis using AI services</li>
                  <li>Payment gateway integration</li>
                  <li>Push notification delivery</li>
                  <li>Email and WhatsApp communication</li>
                </ul>
                
                <h3>High-Level System Flow</h3>
                <ol>
                  <li>User authentication and role assignment</li>
                  <li>Role-based dashboard presentation</li>
                  <li>Data access filtered through RLS policies</li>
                  <li>Real-time updates via subscriptions</li>
                  <li>Specialized processing via Edge Functions</li>
                  <li>External integrations through webhooks</li>
                </ol>
                
                <h3>Security Architecture</h3>
                <p>The system implements a defense-in-depth security strategy:</p>
                <ul>
                  <li>JWT-based authentication with refresh tokens</li>
                  <li>Database-level access controls (RLS)</li>
                  <li>Parameterized queries to prevent SQL injection</li>
                  <li>Content Security Policy for XSS protection</li>
                  <li>API rate limiting to prevent abuse</li>
                  <li>Audit logging for security events</li>
                </ul>
                
                <h3>System Integration Points</h3>
                <ul>
                  <li>Razorpay payment gateway</li>
                  <li>Push notification services</li>
                  <li>Email delivery services</li>
                  <li>WhatsApp Business API</li>
                  <li>AI document analysis services</li>
                  <li>External monitoring tools</li>
                </ul>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};
