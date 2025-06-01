
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

    console.log(`Resetting stuck registration tasks for patient: ${patient_id}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Reset failed registration tasks back to pending status
    const { data: resetResult, error: resetError } = await supabaseClient
      .from('registration_tasks')
      .update({
        status: 'pending',
        retry_count: 0,
        next_retry_at: new Date().toISOString(),
        error_details: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', patient_id)
      .eq('status', 'failed');

    if (resetError) {
      console.error("Error resetting tasks:", resetError);
      throw new Error(`Failed to reset tasks: ${resetError.message}`);
    }

    console.log(`Reset result:`, resetResult);

    // Also update the user's registration status back to payment_complete so tasks can be processed
    const { error: statusError } = await supabaseClient
      .from('profiles')
      .update({ 
        registration_status: 'payment_complete',
        updated_at: new Date().toISOString()
      })
      .eq('id', patient_id);

    if (statusError) {
      console.error(`Error updating registration status:`, statusError);
    } else {
      console.log(`User ${patient_id} registration status reset to payment_complete`);
    }

    return new Response(
      JSON.stringify({
        message: "Registration tasks reset successfully",
        patient_id,
        reset_count: resetResult?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reset-stuck-registration-tasks:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
