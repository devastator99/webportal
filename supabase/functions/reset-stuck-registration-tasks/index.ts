
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { patient_email } = await req.json();
    
    if (!patient_email) {
      return new Response(
        JSON.stringify({ error: "Patient email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log(`Resetting stuck registration tasks for: ${patient_email}`);

    // Get the user ID from auth.users by email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to get users: ${authError.message}`);
    }

    const user = authUsers.users.find(u => u.email === patient_email);
    if (!user) {
      return new Response(
        JSON.stringify({ error: `User with email ${patient_email} not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`Found user ID: ${userId} for email: ${patient_email}`);

    // Reset any stuck tasks (in_progress back to pending)
    const { data: resetData, error: resetError } = await supabase
      .from('registration_tasks')
      .update({
        status: 'pending',
        retry_count: 0,
        error_details: null,
        next_retry_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .select();

    if (resetError) {
      console.error("Error resetting tasks:", resetError);
      throw new Error(`Failed to reset tasks: ${resetError.message}`);
    }

    console.log(`Reset ${resetData?.length || 0} stuck tasks`);

    // Now trigger the registration task processor for this specific user
    const { data: processResult, error: processError } = await supabase.functions.invoke(
      'process-registration-tasks',
      { body: { patient_id: userId } }
    );

    if (processError) {
      console.error("Error triggering task processor:", processError);
      throw new Error(`Failed to trigger task processor: ${processError.message}`);
    }

    console.log("Task processor triggered successfully:", processResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Registration tasks reset and processing triggered for ${patient_email}`,
        user_id: userId,
        reset_tasks: resetData?.length || 0,
        processor_result: processResult
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in reset-stuck-registration-tasks:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
