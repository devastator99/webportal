import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper function to get OpenAI response
async function getOpenAIResponse(conversation: any[], systemPrompt: string) {
  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.warn("OpenAI API key not found in environment variables");
      return null;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversation
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return null;
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return null;
  }
}

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
    
    console.log(`Processing message in room ${roomId}: "${message}"`);
    
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
    
    // Get basic patient information for context
    const { data: patientProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', patientId)
      .single();
      
    if (profileError) {
      console.error("Error fetching patient profile:", profileError);
    }
    
    const patientName = patientProfile ? `${patientProfile.first_name} ${patientProfile.last_name}` : "Unknown Patient";
    
    // Collect context for OpenAI
    let patientContext = `Patient: ${patientName} (ID: ${patientId})`;
    let medicalData = "";
    
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
        const { data: prescriptions, error: prescriptionError } = await supabaseClient
          .rpc('get_all_patient_prescriptions', {
            p_patient_id: patientId
          });
        
        if (prescriptionError) {
          console.error(`Error fetching prescriptions: ${prescriptionError.message}`);
          throw prescriptionError;
        }
        
        if (!prescriptions || prescriptions.length === 0) {
          medicalData += "No prescriptions found in patient records.\n";
          aiResponse = "I don't see any prescriptions in your records yet. Please ask your doctor about prescriptions during your next appointment.";
        } else {
          const latestPrescription = prescriptions[0];
          const prescriptionDate = new Date(latestPrescription.created_at).toLocaleDateString();
          
          // Generate prescription PDF data
          const pdfData = {
            doctorName: `Dr. ${latestPrescription.doctor_first_name} ${latestPrescription.doctor_last_name}`,
            date: prescriptionDate,
            patientName: `${patientProfile?.first_name} ${patientProfile?.last_name}`,
            diagnosis: latestPrescription.diagnosis,
            medications: latestPrescription.prescription,
            notes: latestPrescription.notes || '',
          };

          // Updated response to clearly indicate PDF generation
          aiResponse = `I've generated your latest prescription as a PDF. This prescription was written by Dr. ${latestPrescription.doctor_first_name} ${latestPrescription.doctor_last_name} on ${prescriptionDate}.\n\nThe prescription includes:\n- Diagnosis: ${latestPrescription.diagnosis}\n- Prescribed medications: ${latestPrescription.prescription}${latestPrescription.notes ? `\n- Additional notes: ${latestPrescription.notes}` : ''}\n\n📄 Prescription PDF has been generated and is ready for download.`;

          // Return with PDF generation data
          return new Response(
            JSON.stringify({ 
              response: aiResponse,
              generatePdf: true,
              pdfType: 'prescription',
              pdfData: pdfData
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (error) {
        console.error("Error fetching prescription data:", error);
        aiResponse = "I apologize, but I'm having trouble accessing your prescription information right now. Please try again later or check the Prescriptions section in your app.";
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
        
        if (healthPlanError) {
          console.error(`Error fetching health plan: ${healthPlanError.message}`);
          throw healthPlanError;
        }
        
        if (!healthPlan || healthPlan.length === 0) {
          medicalData += "No health plan found in patient records.\n";
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
          
          medicalData += "Patient health plan:\n";
          for (const [type, items] of Object.entries(groupedItems)) {
            medicalData += `${type.charAt(0).toUpperCase() + type.slice(1)}:\n`;
            for (const item of items) {
              medicalData += `• ${item.description} - ${item.scheduled_time} (${item.frequency})\n`;
            }
            medicalData += "\n";
          }
          
          // Use OpenAI for more natural response
          const systemPrompt = `You are a healthcare assistant providing information about a patient's health plan. Be helpful, concise, and strictly use only the information provided in the health plan data. Focus on the specifics from their plan and encourage them to follow their plan. Do not invent any information not contained in the data provided.`;
          const aiGeneratedResponse = await getOpenAIResponse([
            { role: "user", content: `Based on the following patient health plan data, please provide a helpful response to their question: "${message}"\n\n${medicalData}` }
          ], systemPrompt);
          
          if (aiGeneratedResponse) {
            aiResponse = aiGeneratedResponse;
          } else {
            // Fallback if OpenAI fails
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
        
        if (appointmentsError) {
          console.error(`Error fetching appointments: ${appointmentsError.message}`);
          throw appointmentsError;
        }
        
        if (!appointments || appointments.length === 0) {
          medicalData += "No upcoming appointments found in patient records.\n";
          aiResponse = "I don't see any upcoming appointments in your schedule. Would you like information on how to book an appointment?";
        } else {
          // Sort appointments by date
          const sortedAppointments = appointments.sort((a, b) => 
            new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
          );
          
          medicalData += "Patient appointments:\n";
          sortedAppointments.forEach((appt, index) => {
            const apptDate = new Date(appt.scheduled_at);
            medicalData += `${index + 1}. ${apptDate.toLocaleDateString()} at ${apptDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n`;
            medicalData += `   Doctor: Dr. ${appt.doctor_first_name} ${appt.doctor_last_name}\n`;
            medicalData += `   Status: ${appt.status}\n\n`;
          });
          
          // Use OpenAI for more natural response
          const systemPrompt = `You are a healthcare assistant providing information about a patient's appointments. Be helpful, concise, and strictly use only the information provided in the appointments data. Do not invent any information.`;
          const aiGeneratedResponse = await getOpenAIResponse([
            { role: "user", content: `Based on the following patient appointment data, please provide a helpful response to their question: "${message}"\n\n${medicalData}` }
          ], systemPrompt);
          
          if (aiGeneratedResponse) {
            aiResponse = aiGeneratedResponse;
          } else {
            // Fallback if OpenAI fails
            aiResponse = "Here are your upcoming appointments:\n\n";
            
            for (const appt of sortedAppointments) {
              const apptDate = new Date(appt.scheduled_at);
              aiResponse += `• ${apptDate.toLocaleDateString()} at ${apptDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n`;
              aiResponse += `  Doctor: Dr. ${appt.doctor_first_name} ${appt.doctor_last_name}\n`;
              aiResponse += `  Status: ${appt.status}\n\n`;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching appointment data:", error);
        aiResponse = "I'm having trouble accessing your appointment information right now. Please try again later.";
      }
    }
    // Handle medical reports or test results queries
    else if (message.toLowerCase().includes('medical report') || 
             message.toLowerCase().includes('test result') ||
             message.toLowerCase().includes('lab result') ||
             message.toLowerCase().includes('reports')) {
      
      try {
        // Get medical reports
        const { data: reports, error: reportsError } = await supabaseClient
          .rpc('get_patient_medical_reports', {
            p_patient_id: patientId
          });
          
        if (reportsError) {
          console.error(`Error fetching medical reports: ${reportsError.message}`);
          throw reportsError;
        }
        
        if (!reports || reports.length === 0) {
          medicalData += "No medical reports found in patient records.\n";
          aiResponse = "I don't see any medical reports in your records yet. You can upload reports through this chat using the paperclip icon, or ask your doctor to add them during your next appointment.";
        } else {
          // Sort reports by date, newest first
          const sortedReports = reports.sort((a, b) => 
            new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
          );
          
          medicalData += "Patient medical reports:\n";
          const recentReports = sortedReports.slice(0, 5);
          for (const report of recentReports) {
            medicalData += `• ${report.file_name} (uploaded on ${new Date(report.uploaded_at).toLocaleDateString()})\n`;
          }
          
          if (sortedReports.length > 5) {
            medicalData += `Plus ${sortedReports.length - 5} more reports available in patient health records.\n`;
          }
          
          // Use OpenAI for more natural response
          const systemPrompt = `You are a healthcare assistant providing information about a patient's medical reports. Be helpful, concise, and strictly use only the information provided in the medical data. Do not invent any information.`;
          const aiGeneratedResponse = await getOpenAIResponse([
            { role: "user", content: `Based on the following patient medical reports data, please provide a helpful response to their question: "${message}"\n\n${medicalData}` }
          ], systemPrompt);
          
          if (aiGeneratedResponse) {
            aiResponse = aiGeneratedResponse;
          } else {
            // Fallback if OpenAI fails
            aiResponse = "Here are your most recent medical reports:\n\n";
            
            for (const report of recentReports) {
              aiResponse += `• ${report.file_name} (uploaded on ${new Date(report.uploaded_at).toLocaleDateString()})\n`;
            }
            
            if (sortedReports.length > 5) {
              aiResponse += `\nPlus ${sortedReports.length - 5} more reports available in your health records.`;
            }
            
            aiResponse += "\n\nYou can view these reports in the Medical Reports section of your app.";
          }
        }
      } catch (error) {
        console.error("Error fetching medical reports:", error);
        aiResponse = "I'm having trouble accessing your medical reports right now. Please try again later.";
      }
    }
    // Handle doctor/care team-related queries
    else if (message.toLowerCase().includes('my doctor') || 
             message.toLowerCase().includes('my nutritionist') ||
             message.toLowerCase().includes('care team') ||
             message.toLowerCase().includes('who is taking care')) {
      
      try {
        // Get care team information
        const { data: careTeam, error: careTeamError } = await supabaseClient
          .rpc('get_patient_care_team', {
            p_patient_id: patientId
          });
          
        if (careTeamError) {
          console.error(`Error fetching care team: ${careTeamError.message}`);
          throw careTeamError;
        }
        
        if (!careTeam || careTeam.length === 0) {
          medicalData += "No care team members assigned to this patient.\n";
          aiResponse = "You don't have any care team members assigned yet. An administrator can help assign a doctor and nutritionist to your care team.";
        } else {
          medicalData += "Patient care team:\n";
          
          careTeam.forEach(member => {
            medicalData += `• ${member.first_name} ${member.last_name} (${member.role})\n`;
          });
          
          // Use OpenAI for more natural response
          const systemPrompt = `You are a healthcare assistant providing information about a patient's care team. Be helpful, concise, and strictly use only the information provided in the medical data. Do not invent any information.`;
          const aiGeneratedResponse = await getOpenAIResponse([
            { role: "user", content: `Based on the following patient care team data, please provide a helpful response to their question: "${message}"\n\n${medicalData}` }
          ], systemPrompt);
          
          if (aiGeneratedResponse) {
            aiResponse = aiGeneratedResponse;
          } else {
            // Fallback if OpenAI fails
            aiResponse = "Your care team consists of:\n\n";
            
            careTeam.forEach(member => {
              aiResponse += `• ${member.first_name} ${member.last_name} (${member.role})\n`;
            });
            
            aiResponse += "\nYou can communicate with your care team members through this chat.";
          }
        }
      } catch (error) {
        console.error("Error fetching care team data:", error);
        aiResponse = "I'm having trouble accessing your care team information right now. Please try again later.";
      }
    }
    // Handle upload related queries
    else if (message.toLowerCase().includes('upload') || 
             message.toLowerCase().includes('attach') ||
             message.toLowerCase().includes('send file')) {
      
      aiResponse = "You can upload medical reports and test results directly in this chat. Simply click the paperclip icon in the message input and select your file. I support PDF, DOC, JPEG, and PNG files up to 50MB in size. Your care team will be notified when you upload a report.";
    }
    // Handle basic greetings and other queries
    else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      aiResponse = "Hello! I'm your healthcare AI assistant. I can help with information about your prescriptions, health plan, appointments, or general health questions. You can also upload medical reports directly in this chat using the paperclip icon. How can I help you today?";
    } else if (message.toLowerCase().includes('help')) {
      aiResponse = "I can help with:\n• Information about your prescriptions\n• Details of your health plan\n• Viewing your upcoming appointments\n• Answering general health questions\n• Connecting you with your care team\n• Receiving your medical reports and test results\n\nTo upload a report, click the paperclip icon in the message input. What would you like to know about?";
    } else if (message.toLowerCase().includes('thank')) {
      aiResponse = "You're welcome! I'm here to help you and your care team communicate effectively.";
    } else {
      // For generic messages, use OpenAI to generate a contextual response
      const systemPrompt = `You are a healthcare AI assistant helping a patient named ${patientName}. 
      You should be helpful, empathetic, and informative. 
      Your role is to assist the patient with information about their healthcare journey, 
      but always remind them to consult healthcare professionals for medical advice.
      
      You can help with general health questions, explanations about medical terms, 
      and navigating the healthcare system. Always be supportive and respectful.
      
      If you don't know something specific about the patient, you can suggest they ask 
      their care team or check specific sections of the healthcare app.`;
      
      const aiGeneratedResponse = await getOpenAIResponse([
        { role: "user", content: message }
      ], systemPrompt);
      
      if (aiGeneratedResponse) {
        aiResponse = aiGeneratedResponse;
      } else {
        // Fallback if OpenAI fails
        aiResponse = "I'm your healthcare AI assistant. I can help with information about your prescriptions, health plan, appointments, or general health questions. Is there something specific you'd like to know about your healthcare?";
      }
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
        messageId: messageData?.id,
        room_id: roomId 
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
