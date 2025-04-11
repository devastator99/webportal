
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
    let aiResponse = "I'm your healthcare AI assistant. I can help answer general health questions, but please consult with your healthcare providers for medical advice.";
    
    // Handle prescription-related queries
    if (message.toLowerCase().includes('prescription') || 
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
    // Handle basic greetings and other queries
    else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      aiResponse = "Hello! I'm your healthcare AI assistant. I can help with information about your prescriptions, health plan, or general health questions. How can I help you today?";
    } else if (message.toLowerCase().includes('help')) {
      aiResponse = "I can help with:\n• Information about your prescriptions\n• Details of your health plan\n• Answering general health questions\n• Connecting you with your care team\n\nWhat would you like to know about?";
    } else if (message.toLowerCase().includes('doctor') || message.toLowerCase().includes('appointment')) {
      aiResponse = "Your care team is available to assist you. If you need to schedule an appointment or have specific medical questions, please let your doctor know directly through this chat.";
    } else if (message.toLowerCase().includes('thank')) {
      aiResponse = "You're welcome! I'm here to help you and your care team communicate effectively.";
    } else if (message.toLowerCase().includes('reminder') || message.toLowerCase().includes('notify')) {
      aiResponse = "I can send you reminders for your health plan activities. You can set these up in the Habits section of the app by tapping on an activity and selecting 'Set Reminder'.";
    }
    
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
