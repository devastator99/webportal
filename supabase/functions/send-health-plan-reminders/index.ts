
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
        scheduled_time,
        description,
        frequency,
        duration,
        patient_id,
        nutritionist_id
      `)
      .or(`scheduled_time.ilike.%${currentTimeString}%,scheduled_time.ilike.%${currentHour.toString().padStart(2, '0')}:${Math.floor(currentMinute / 5) * 5}%`);
    
    if (healthPlanError) {
      console.error("Error fetching health plan items:", healthPlanError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch health plan items" }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`Found ${healthPlanItems?.length || 0} health plan items for the current time`);
    
    if (!healthPlanItems || healthPlanItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reminders to send at this time" }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Group health plan items by patient for consolidated messages
    const patientItemsMap: Record<string, any[]> = {};
    healthPlanItems.forEach(item => {
      if (!patientItemsMap[item.patient_id]) {
        patientItemsMap[item.patient_id] = [];
      }
      patientItemsMap[item.patient_id].push(item);
    });
    
    // Process each patient's reminders
    const results = [];
    for (const [patientId, items] of Object.entries(patientItemsMap)) {
      try {
        // Get patient info
        const { data: patient, error: patientError } = await supabaseAdmin
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', patientId)
          .single();
        
        if (patientError || !patient) {
          console.error(`Error getting patient details for ID ${patientId}:`, patientError);
          continue;
        }
        
        // Format items for reminder message
        const typeEmojis = {
          'food': '🍎',
          'exercise': '🏃‍♂️',
          'medication': '💊'
        };
        
        let reminderMessage = `Hello ${patient.first_name}, here are your health plan reminders:\n\n`;
        
        items.forEach(item => {
          const emoji = typeEmojis[item.type as keyof typeof typeEmojis] || '✅';
          reminderMessage += `${emoji} **${item.type.toUpperCase()}**: ${item.description}\n`;
          if (item.frequency) {
            reminderMessage += `   Frequency: ${item.frequency}\n`;
          }
          if (item.duration) {
            reminderMessage += `   Duration: ${item.duration}\n`;
          }
          reminderMessage += '\n';
        });
        
        reminderMessage += "Remember to follow your health plan regularly for the best results. If you have any questions, please message your care team.";
        
        // Send message via AI assistant 
        const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-ai-care-team-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
          },
          body: JSON.stringify({
            patient_id: patientId,
            title: "Health Plan Reminder",
            message: reminderMessage,
            message_type: "health_plan_reminder"
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log(`Successfully sent reminder to patient ${patientId}`);
          results.push({
            patient_id: patientId,
            success: true,
            items_count: items.length,
            message_id: result.message_id
          });
        } else {
          console.error(`Error sending reminder to patient ${patientId}:`, result.error);
          results.push({
            patient_id: patientId,
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        console.error(`Error processing patient ${patientId}:`, error);
        results.push({
          patient_id: patientId,
          success: false,
          error: 'Internal processing error'
        });
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        timestamp: new Date().toISOString(),
        reminders_processed: results.length
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in health plan reminder function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
