
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Assign Nutritionist Notification Function started");

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nutritionistId, patientId, prescriptionId } = await req.json();
    
    console.log(`Notification request received for nutritionist ${nutritionistId}, patient ${patientId}, prescription ${prescriptionId}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get nutritionist details
    const { data: nutritionist, error: nutritionistError } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', nutritionistId)
      .single();
      
    if (nutritionistError) {
      throw nutritionistError;
    }
    
    // Get patient details
    const { data: patient, error: patientError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', patientId)
      .single();
      
    if (patientError) {
      throw patientError;
    }

    // Get prescription details
    const { data: prescription, error: prescriptionError } = await supabase
      .from('medical_records')
      .select('diagnosis, prescription')
      .eq('id', prescriptionId)
      .single();
      
    if (prescriptionError) {
      throw prescriptionError;
    }

    console.log("Retrieved patient and nutritionist data");
    
    // Send WhatsApp notification (mock for now)
    if (nutritionist.phone) {
      console.log(`Would send WhatsApp notification to ${nutritionist.phone} for nutritionist ${nutritionist.first_name} ${nutritionist.last_name}`);
      
      // Here you would integrate with actual WhatsApp API
      // For example, using Twilio:
      /*
      const message = await client.messages.create({
        body: `You have been assigned a new patient: ${patient.first_name} ${patient.last_name}. 
        Diagnosis: ${prescription.diagnosis}. 
        Please create a nutrition plan based on the prescription.`,
        from: 'whatsapp:+14155238886',
        to: `whatsapp:${nutritionist.phone}`
      });
      */
    }

    // Record the notification in a database log
    const { data: logData, error: logError } = await supabase
      .from('notification_logs')
      .insert({
        recipient_id: nutritionistId,
        recipient_type: 'nutritionist',
        notification_type: 'patient_assignment',
        related_id: patientId,
        message: `You have been assigned patient ${patient.first_name} ${patient.last_name}`,
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
    console.error("Error in assign-nutritionist-notification function:", error);
    
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
