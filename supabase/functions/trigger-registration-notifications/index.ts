
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { patient_id } = await req.json();
    
    console.log("Triggering registration notifications for patient:", patient_id);
    
    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: "Patient ID is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Process pending tasks in a loop until all are complete
    let maxRetries = 10;
    let currentRetry = 0;
    let allTasksComplete = false;
    
    while (!allTasksComplete && currentRetry < maxRetries) {
      currentRetry++;
      console.log(`Processing tasks attempt ${currentRetry}/${maxRetries}`);
      
      // Call the task processor
      const { data: processResult, error: processError } = await supabase.functions.invoke(
        'process-registration-tasks',
        { body: {} }
      );
      
      if (processError) {
        console.error("Task processing error:", processError);
        break;
      }
      
      console.log("Task processing result:", processResult);
      
      // Check if there are more pending tasks for this patient
      const { data: pendingTasks, error: taskError } = await supabase
        .from('registration_tasks')
        .select('id, task_type, status')
        .eq('user_id', patient_id)
        .eq('status', 'pending');
      
      if (taskError) {
        console.error("Error checking pending tasks:", taskError);
        break;
      }
      
      if (!pendingTasks || pendingTasks.length === 0) {
        allTasksComplete = true;
        console.log("All tasks completed for patient:", patient_id);
      } else {
        console.log(`${pendingTasks.length} tasks still pending for patient ${patient_id}`);
        // Wait a bit before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Get final status
    const { data: finalStatus, error: statusError } = await supabase.rpc(
      'get_user_registration_status_safe',
      { p_user_id: patient_id }
    );
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Registration notification processing completed after ${currentRetry} attempts`,
        all_tasks_complete: allTasksComplete,
        final_status: finalStatus,
        attempts_made: currentRetry
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error: any) {
    console.error("Error in trigger-registration-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
