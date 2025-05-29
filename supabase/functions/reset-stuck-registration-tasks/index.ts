
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
    const { patient_email } = await req.json();
    
    if (!patient_email) {
      return new Response(
        JSON.stringify({ error: "Patient email is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Resetting registration tasks for: ${patient_email}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user ID by email using RPC function
    const { data: userId, error: userIdError } = await supabaseClient.rpc(
      'get_user_id_by_email',
      { user_email: patient_email }
    );

    if (userIdError || !userId) {
      console.error("User not found or error:", userIdError);
      return new Response(
        JSON.stringify({ error: `User with email ${patient_email} not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found user ID: ${userId} for email: ${patient_email}`);

    // Reset all failed and stuck tasks for this user
    const { data: resetData, error: resetError } = await supabaseClient
      .from('registration_tasks')
      .update({
        status: 'pending',
        retry_count: 0,
        error_details: null,
        next_retry_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .in('status', ['failed', 'pending'])
      .select();

    if (resetError) {
      console.error("Error resetting tasks:", resetError);
      return new Response(
        JSON.stringify({ error: `Failed to reset tasks: ${resetError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Reset ${resetData?.length || 0} tasks for user ${userId}`);

    // Now trigger the processing
    console.log("Triggering task processing...");
    const { data: processResult, error: processError } = await supabaseClient.functions.invoke(
      'process-registration-tasks',
      { body: { patient_id: userId } }
    );

    if (processError) {
      console.error("Error triggering task processing:", processError);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Tasks reset for ${patient_email} but failed to trigger processing: ${processError.message}`,
          reset_count: resetData?.length || 0,
          user_id: userId,
          processing_error: processError.message
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Registration tasks reset and processing triggered for ${patient_email}`,
        reset_count: resetData?.length || 0,
        user_id: userId,
        processing_result: processResult
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in reset-stuck-registration-tasks:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
