
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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    );
    
    // Current time in UTC
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    // Format the current time like "08:30" for comparison
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    console.log(`Checking for reminders at ${currentTimeString} UTC`);
    
    // Get all health plan items scheduled for the current time
    const { data: healthPlanItems, error: healthPlanError } = await supabaseAdmin
      .from('health_plan_items')
      .select(`
        id,
        type,
        description,
        scheduled_time,
        frequency,
        patient_id,
        reminders_enabled
      `)
      .eq('reminders_enabled', true)
      .filter('scheduled_time', 'ilike', `${currentTimeString}%`);
    
    if (healthPlanError) {
      console.error("Error fetching health plan items:", healthPlanError);
      throw healthPlanError;
    }
    
    console.log(`Found ${healthPlanItems?.length || 0} health plan items scheduled for current time`);
    
    const results = [];
    
    // Process each health plan item
    for (const item of healthPlanItems || []) {
      try {
        // Get the patient's care team room
        const { data: roomData, error: roomError } = await supabaseAdmin
          .from('chat_rooms')
          .select('id')
          .eq('patient_id', item.patient_id)
          .eq('room_type', 'care_team')
          .single();
        
        if (roomError) {
          console.error(`Error finding care team room for patient ${item.patient_id}:`, roomError);
          results.push({
            item_id: item.id,
            status: 'error',
            message: `Error finding care team room: ${roomError.message}`
          });
          continue;
        }
        
        // Create the reminder message
        const reminderMessage = `REMINDER: It's time for your ${item.type} activity: ${item.description}`;
        
        // Send the reminder as an AI message in the care team chat
        const { data: messageData, error: messageError } = await supabaseAdmin
          .from('room_messages')
          .insert({
            room_id: roomData.id,
            sender_id: '00000000-0000-0000-0000-000000000000', // AI bot ID
            message: reminderMessage,
            is_ai_message: true
          })
          .select()
          .single();
        
        if (messageError) {
          console.error(`Error sending reminder message for item ${item.id}:`, messageError);
          results.push({
            item_id: item.id,
            status: 'error',
            message: `Error sending reminder: ${messageError.message}`
          });
        } else {
          console.log(`Successfully sent reminder for item ${item.id} to room ${roomData.id}`);
          results.push({
            item_id: item.id,
            status: 'success',
            message_id: messageData.id
          });
        }
      } catch (error) {
        console.error(`Error processing health plan item ${item.id}:`, error);
        results.push({
          item_id: item.id,
          status: 'error',
          message: `Exception: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: healthPlanItems?.length || 0,
        results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-health-plan-reminders:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
