
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patient_id } = await req.json();
    
    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: "Patient ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Resetting registration for patient: ${patient_id}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Reset all failed tasks to pending
    const { data: updatedTasks, error: updateError } = await supabaseClient
      .from('registration_tasks')
      .update({
        status: 'pending',
        retry_count: 0,
        error_details: null,
        next_retry_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', patient_id)
      .in('status', ['failed', 'error'])
      .select();

    if (updateError) {
      console.error("Error resetting tasks:", updateError);
      throw new Error(`Failed to reset tasks: ${updateError.message}`);
    }

    console.log(`Reset ${updatedTasks?.length || 0} tasks for patient ${patient_id}`);

    // Update patient registration status back to payment_complete
    const { error: statusError } = await supabaseClient
      .from('profiles')
      .update({ 
        registration_status: 'payment_complete',
        updated_at: new Date().toISOString()
      })
      .eq('id', patient_id);

    if (statusError) {
      console.error("Error updating registration status:", statusError);
    }

    // Now trigger the registration process again using the FIXED function
    const { data: triggerResult, error: triggerError } = await supabaseClient.functions.invoke(
      'trigger-registration-notifications',
      { body: { patient_id } }
    );

    if (triggerError) {
      console.error("Error triggering registration:", triggerError);
      throw new Error(`Failed to trigger registration: ${triggerError.message}`);
    }

    return new Response(
      JSON.stringify({
        message: "Patient registration reset and triggered successfully",
        patient_id,
        reset_tasks: updatedTasks?.length || 0,
        trigger_result: triggerResult
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reset-patient-registration:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
