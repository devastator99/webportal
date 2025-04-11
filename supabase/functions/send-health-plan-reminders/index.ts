
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Get environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create Supabase client with admin privileges
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { patientId } = await req.json();
    
    if (!patientId) {
      return new Response(
        JSON.stringify({ error: 'Missing patient ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get patient details
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', patientId)
      .single();
    
    if (patientError || !patient) {
      return new Response(
        JSON.stringify({ error: 'Patient not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get health plan items for the patient
    const { data: healthPlanItems, error: healthPlanError } = await supabaseAdmin
      .rpc('get_patient_health_plan', {
        p_patient_id: patientId
      });
    
    if (healthPlanError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch health plan' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!healthPlanItems || healthPlanItems.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No health plan items to remind about' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the patient's care team room
    const { data: careTeamRoom, error: roomError } = await supabaseAdmin
      .from('chat_rooms')
      .select('id')
      .eq('patient_id', patientId)
      .eq('room_type', 'care_team')
      .eq('is_active', true)
      .single();
      
    if (roomError) {
      console.error('Error finding care team room:', roomError);
      // If no room exists, create one
      if (roomError.code === 'PGRST116') {
        // Get the patient's care team
        const { data: careTeam } = await supabaseAdmin
          .from('patient_assignments')
          .select('doctor_id, nutritionist_id')
          .eq('patient_id', patientId)
          .single();
          
        if (careTeam) {
          // Create a care team room
          const { data: newRoom, error: createRoomError } = await supabaseAdmin
            .rpc('create_care_team_room', {
              p_patient_id: patientId,
              p_doctor_id: careTeam.doctor_id,
              p_nutritionist_id: careTeam.nutritionist_id
            });
            
          if (createRoomError) {
            console.error('Error creating care team room:', createRoomError);
          } else {
            console.log('Created new care team room:', newRoom);
          }
        }
      }
    }
    
    // Filter health plan items for today
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Find items scheduled for the current time (±30 minutes)
    const itemsDueNow = healthPlanItems.filter(item => {
      const [scheduledHour, scheduledMinute] = item.scheduled_time.split(':').map(Number);
      const scheduledTotalMinutes = scheduledHour * 60 + scheduledMinute;
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      
      // Check if the scheduled time is within 30 minutes of the current time
      return Math.abs(scheduledTotalMinutes - currentTotalMinutes) <= 30;
    });
    
    if (itemsDueNow.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No health plan items due at this time' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Send reminders for each item
    const reminderResults = [];
    
    for (const item of itemsDueNow) {
      // If we have a care team room, send a message there
      if (careTeamRoom) {
        // Create a reminder message
        const reminderMessage = `
Reminder for ${patient.first_name} ${patient.last_name}:
${item.type.charAt(0).toUpperCase() + item.type.slice(1)}: ${item.description}
Scheduled for: ${item.scheduled_time}
Frequency: ${item.frequency}
${item.duration ? `Duration: ${item.duration}` : ''}

This is an automated reminder from your health plan.`;
        
        // Send message to care team room
        const { data: message, error: messageError } = await supabaseAdmin
          .from('room_messages')
          .insert({
            room_id: careTeamRoom.id,
            sender_id: '00000000-0000-0000-0000-000000000000', // AI bot ID
            message: reminderMessage,
            is_system_message: true,
            is_ai_message: true
          })
          .select()
          .single();
          
        if (messageError) {
          console.error('Error sending reminder message:', messageError);
          reminderResults.push({
            item_id: item.id,
            success: false,
            error: messageError.message
          });
        } else {
          reminderResults.push({
            item_id: item.id,
            success: true,
            message_id: message.id
          });
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        message: `Sent ${reminderResults.filter(r => r.success).length} reminders for health plan items`,
        results: reminderResults
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in send-health-plan-reminders:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
