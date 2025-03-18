
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Send Health Plan Reminders Function started");

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientId, nutritionistId } = await req.json();
    
    console.log(`Reminder request received for patient ${patientId} from nutritionist ${nutritionistId}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get patient details
    const { data: patient, error: patientError } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', patientId)
      .single();
      
    if (patientError) {
      throw patientError;
    }
    
    // Get nutritionist details
    const { data: nutritionist, error: nutritionistError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', nutritionistId)
      .single();
      
    if (nutritionistError) {
      throw nutritionistError;
    }

    // Get patient's health plan items using RPC
    const { data: healthPlanItems, error: healthPlanError } = await supabase
      .rpc('get_patient_health_plan', {
        p_patient_id: patientId
      });
      
    if (healthPlanError) {
      throw healthPlanError;
    }

    if (!healthPlanItems || healthPlanItems.length === 0) {
      throw new Error("No health plan items found for this patient");
    }

    console.log(`Found ${healthPlanItems.length} health plan items`);
    
    // Send WhatsApp reminders (mock for now)
    if (patient.phone) {
      console.log(`Would send WhatsApp health plan reminders to ${patient.phone} for patient ${patient.first_name} ${patient.last_name}`);
      
      // Format the message
      const reminderMessage = `Hello ${patient.first_name}, here is your health plan from Dr. ${nutritionist.first_name} ${nutritionist.last_name}:\n\n` + 
        healthPlanItems.map((item: any) => {
          return `${item.time} - ${item.type.toUpperCase()}: ${item.description} (${item.frequency})`;
        }).join('\n\n');
      
      console.log("Reminder message:", reminderMessage);
      
      // Here you would integrate with actual WhatsApp API
      // For example, using Twilio:
      /*
      const message = await client.messages.create({
        body: reminderMessage,
        from: 'whatsapp:+14155238886',
        to: `whatsapp:${patient.phone}`
      });
      */
    }

    // Record the reminders in a database log
    const { data: logData, error: logError } = await supabase
      .from('notification_logs')
      .insert({
        recipient_id: patientId,
        recipient_type: 'patient',
        notification_type: 'health_plan_reminder',
        related_id: nutritionistId,
        message: `Health plan reminders sent by ${nutritionist.first_name} ${nutritionist.last_name}`,
        status: 'sent'
      })
      .select()
      .single();
      
    if (logError) {
      console.error("Error logging notification:", logError);
      // Continue anyway
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Health plan reminders sent successfully",
        items_count: healthPlanItems.length,
        notification_id: logData?.id
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
    
  } catch (error) {
    console.error("Error in send-health-plan-reminders function:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
        status: 400 
      }
    );
  }
});
