
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Send Health Plan Notification Function started");

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientId, nutritionistId, planItems } = await req.json();
    
    console.log(`Notification request received for patient ${patientId} from nutritionist ${nutritionistId}, ${planItems} items`);

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

    console.log("Retrieved patient and nutritionist data");
    
    // Send WhatsApp notification (mock for now)
    if (patient.phone) {
      console.log(`Would send WhatsApp notification to ${patient.phone} for patient ${patient.first_name} ${patient.last_name}`);
      
      // Here you would integrate with actual WhatsApp API
      // For example, using Twilio:
      /*
      const message = await client.messages.create({
        body: `Hello ${patient.first_name},\n\nYour nutritionist ${nutritionist.first_name} ${nutritionist.last_name} has created a health plan for you with ${planItems} items. Check your account for details.`,
        from: 'whatsapp:+14155238886',
        to: `whatsapp:${patient.phone}`
      });
      */
    }

    // Record the notification in a database log
    const { data: logData, error: logError } = await supabase
      .from('notification_logs')
      .insert({
        recipient_id: patientId,
        recipient_type: 'patient',
        notification_type: 'health_plan_created',
        related_id: nutritionistId,
        message: `A new health plan with ${planItems} items has been created for you by ${nutritionist.first_name} ${nutritionist.last_name}`,
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
        message: "Notification sent successfully",
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
    console.error("Error in send-health-plan-notification function:", error);
    
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
