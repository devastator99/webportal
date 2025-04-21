
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { roomId, message } = await req.json();
    
    if (!roomId || !message) {
      return new Response(
        JSON.stringify({ error: "Room ID and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    );
    
    // Get chat room details to check if it's a care team room
    const { data: roomData, error: roomError } = await supabaseClient
      .from('chat_rooms')
      .select('id, room_type, patient_id')
      .eq('id', roomId)
      .single();
      
    if (roomError) {
      console.error("Error fetching room details:", roomError);
      return new Response(
        JSON.stringify({ error: "Room not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (roomData.room_type !== 'care_team') {
      return new Response(
        JSON.stringify({ error: "AI responses are only available in care team rooms" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const patientId = roomData.patient_id;
    let aiResponse = "I'm your healthcare AI assistant. I can help answer questions about your prescriptions, health plan, or medical advice. However, please consult with your healthcare providers for specific medical guidance.";
    
    console.log(`Processing message from care team room ${roomId} for patient ${patientId}`);
    console.log(`Message content: ${message}`);
    
    // Handle file upload messages
    if (message.startsWith('[FILE_UPLOAD_SUCCESS]')) {
      const fileName = message.replace('[FILE_UPLOAD_SUCCESS]', '').trim();
      aiResponse = `The medical report "${fileName}" has been successfully uploaded and added to your records. Your care team will be able to review it. Is there anything specific about this report you'd like to discuss?`;
    }
    else if (message.startsWith('[FILE_UPLOAD_ERROR]')) {
      const fileName = message.replace('[FILE_UPLOAD_ERROR]', '').trim();
      aiResponse = `I'm sorry, there was an error uploading your medical report "${fileName}". This could be due to file size limitations or network issues. Please try again with a smaller file (max 50MB) or make sure you have a stable internet connection.`;
    }
    // Handle prescription-related queries
    else if (message.toLowerCase().includes('prescription') || 
        message.toLowerCase().includes('medicine') || 
        message.toLowerCase().includes('medication')) {
      
      try {
        // Get the doctor assigned to this patient
        const { data: assignment, error: assignmentError } = await supabaseClient
          .from('patient_assignments')
          .select('doctor_id')
          .eq('patient_id', patientId)
          .single();
        
        if (assignmentError || !assignment?.doctor_id) {
          aiResponse = "I don't see any prescriptions in your records. Please ask your doctor about prescriptions during your next appointment.";
        } else {
          // Get prescriptions
          const { data: prescriptions, error: prescriptionError } = await supabaseClient
            .rpc('get_patient_prescriptions', {
              p_patient_id: patientId,
              p_doctor_id: assignment.doctor_id
            });
          
          if (prescriptionError || !prescriptions || prescriptions.length === 0) {
            aiResponse = "I don't see any prescriptions in your records yet. Please ask your doctor about prescriptions during your next appointment.";
          } else {
            // If they want the prescription as PDF, let them know how to view it
            if (message.toLowerCase().includes('pdf') || 
                message.toLowerCase().includes('download') || 
                message.toLowerCase().includes('file') ||
                message.toLowerCase().includes('share')) {
              aiResponse = `I can help you access your prescription. Your latest prescription was from Dr. ${prescriptions[0].doctor_first_name} ${prescriptions[0].doctor_last_name} on ${new Date(prescriptions[0].created_at).toLocaleDateString()}. You can view and download it as a PDF from the AI chat in your dashboard or from the prescriptions page.`;
            } else {
              // Just provide prescription details
              const latestPrescription = prescriptions[0];
              aiResponse = `Your latest prescription from Dr. ${latestPrescription.doctor_first_name} ${latestPrescription.doctor_last_name} (${new Date(latestPrescription.created_at).toLocaleDateString()}):\n\nDiagnosis: ${latestPrescription.diagnosis}\n\nPrescribed medications: ${latestPrescription.prescription}`;
              
              if (latestPrescription.notes) {
                aiResponse += `\n\nAdditional notes: ${latestPrescription.notes}`;
              }
              
              aiResponse += "\n\nYou can also view and download this as a PDF from the Prescriptions section in your app.";
            }
          }
        }
      } catch (error) {
        console.error("Error fetching prescription data:", error);
        aiResponse = "I'm having trouble accessing your prescription information right now. Please try again later or check the Prescriptions section in your app.";
      }
    } 
    // Handle health plan related queries
    else if (message.toLowerCase().includes('health plan') || 
             message.toLowerCase().includes('routine') || 
             message.toLowerCase().includes('diet') || 
             message.toLowerCase().includes('exercise') ||
             message.toLowerCase().includes('habit')) {
      
      try {
        // Get health plan
        const { data: healthPlan, error: healthPlanError } = await supabaseClient
          .rpc('get_patient_health_plan', {
            p_patient_id: patientId
          });
        
        if (healthPlanError || !healthPlan || healthPlan.length === 0) {
          aiResponse = "I don't see a health plan in your records yet. Your nutritionist can create one for you during your next appointment.";
        } else {
          // Group by type for a more organized response
          const groupedItems: Record<string, any[]> = {};
          healthPlan.forEach(item => {
            if (!groupedItems[item.type]) {
              groupedItems[item.type] = [];
            }
            groupedItems[item.type].push(item);
          });
          
          aiResponse = "Here's a summary of your health plan:\n\n";
          
          for (const [type, items] of Object.entries(groupedItems)) {
            aiResponse += `${type.charAt(0).toUpperCase() + type.slice(1)}:\n`;
            for (const item of items) {
              aiResponse += `• ${item.description} - ${item.scheduled_time} (${item.frequency})\n`;
            }
            aiResponse += "\n";
          }
          
          aiResponse += "You can view your complete health plan and track your progress in the Habits section of the app.";
        }
      } catch (error) {
        console.error("Error fetching health plan data:", error);
        aiResponse = "I'm having trouble accessing your health plan information right now. Please try again later or check the Habits section in your app.";
      }
    }
    // Handle appointment-related queries
    else if (message.toLowerCase().includes('appointment') || 
             message.toLowerCase().includes('schedule') ||
             message.toLowerCase().includes('doctor visit') ||
             message.toLowerCase().includes('meet')) {
      
      try {
        // Get appointments
        const { data: appointments, error: appointmentsError } = await supabaseClient
          .rpc('get_patient_appointments', {
            p_patient_id: patientId
          });
        
        if (appointmentsError || !appointments || appointments.length === 0) {
          aiResponse = "I don't see any upcoming appointments in your schedule. Would you like information on how to book an appointment?";
        } else {
          aiResponse = "Here are your upcoming appointments:\n\n";
          
          for (const appt of appointments) {
            const apptDate = new Date(appt.scheduled_at);
            aiResponse += `• ${apptDate.toLocaleDateString()} at ${apptDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n`;
            aiResponse += `  Doctor: Dr. ${appt.doctor_first_name} ${appt.doctor_last_name}\n`;
            aiResponse += `  Status: ${appt.status}\n\n`;
          }
        }
      } catch (error) {
        console.error("Error fetching appointment data:", error);
        aiResponse = "I'm having trouble accessing your appointment information right now. Please try again later.";
      }
    }
    // Handle upload related queries
    else if (message.toLowerCase().includes('upload') || 
             message.toLowerCase().includes('report') ||
             message.toLowerCase().includes('test result') ||
             message.toLowerCase().includes('medical record')) {
      
      aiResponse = "You can upload medical reports and test results directly in this chat. Simply click the paperclip icon in the message input and select your file. I support PDF, DOC, JPEG, and PNG files up to 50MB in size. Your care team will be notified when you upload a report.";
    }
    // Handle basic greetings and other queries
    else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      aiResponse = "Hello! I'm your healthcare AI assistant. I can help with information about your prescriptions, health plan, appointments, or general health questions. You can also upload medical reports directly in this chat using the paperclip icon. How can I help you today?";
    } else if (message.toLowerCase().includes('help')) {
      aiResponse = "I can help with:\n• Information about your prescriptions\n• Details of your health plan\n• Viewing your upcoming appointments\n• Answering general health questions\n• Connecting you with your care team\n• Receiving your medical reports and test results\n\nTo upload a report, click the paperclip icon in the message input. What would you like to know about?";
    } else if (message.toLowerCase().includes('doctor') || message.toLowerCase().includes('care team')) {
      aiResponse = "Your care team is available to assist you. If you need to schedule an appointment or have specific medical questions, please let your doctor know directly through this chat.";
    } else if (message.toLowerCase().includes('thank')) {
      aiResponse = "You're welcome! I'm here to help you and your care team communicate effectively.";
    }
    
    console.log("Sending AI response:", aiResponse.substring(0, 100) + "...");
    
    // Insert AI response as a message
    const { data: messageData, error: messageError } = await supabaseClient
      .from('room_messages')
      .insert({
        room_id: roomId,
        sender_id: '00000000-0000-0000-0000-000000000000', // AI bot ID
        message: aiResponse,
        is_ai_message: true
      })
      .select()
      .single();
      
    if (messageError) {
      console.error("Error inserting AI message:", messageError);
      return new Response(
        JSON.stringify({ error: "Failed to send AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: aiResponse,
        messageId: messageData.id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in care-team-ai-chat:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
