
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
    
    // Check if there are any pending tasks for this specific patient
    const { data: pendingTasks, error: initialTaskError } = await supabase
      .from('registration_tasks')
      .select('id, task_type, status, retry_count')
      .eq('user_id', patient_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (initialTaskError) {
      console.error("Error checking initial pending tasks:", initialTaskError);
      return new Response(
        JSON.stringify({ error: "Failed to check pending tasks" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    if (!pendingTasks || pendingTasks.length === 0) {
      console.log("No pending tasks found for patient:", patient_id);
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending registration tasks found for this patient",
          patient_id: patient_id,
          pending_tasks: 0
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    console.log(`Found ${pendingTasks.length} pending tasks for patient ${patient_id}:`, 
      pendingTasks.map(t => `${t.task_type} (retry: ${t.retry_count})`).join(', '));
    
    // Process pending tasks in a loop until all are complete for this patient
    let maxRetries = 10;
    let currentRetry = 0;
    let allTasksComplete = false;
    let processedTasks = [];
    
    while (!allTasksComplete && currentRetry < maxRetries) {
      currentRetry++;
      console.log(`Processing tasks attempt ${currentRetry}/${maxRetries} for patient ${patient_id}`);
      
      // Call the task processor with patient filter
      const { data: processResult, error: processError } = await supabase.functions.invoke(
        'process-registration-tasks',
        { body: { patient_id: patient_id } }
      );
      
      if (processError) {
        console.error("Task processing error:", processError);
        break;
      }
      
      console.log("Task processing result:", processResult);
      
      if (processResult?.success && processResult?.task_id) {
        processedTasks.push({
          task_id: processResult.task_id,
          task_type: processResult.task_type,
          status: 'completed'
        });
      }
      
      // Check if there are more pending tasks for this patient
      const { data: remainingTasks, error: taskError } = await supabase
        .from('registration_tasks')
        .select('id, task_type, status')
        .eq('user_id', patient_id)
        .eq('status', 'pending');
      
      if (taskError) {
        console.error("Error checking remaining tasks:", taskError);
        break;
      }
      
      if (!remainingTasks || remainingTasks.length === 0) {
        allTasksComplete = true;
        console.log("All tasks completed for patient:", patient_id);
      } else {
        console.log(`${remainingTasks.length} tasks still pending for patient ${patient_id}`);
        // Wait a bit before next attempt to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Get final status for this patient
    const { data: finalStatus, error: statusError } = await supabase.rpc(
      'get_user_registration_status_safe',
      { p_user_id: patient_id }
    );
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Registration task processing completed for patient ${patient_id} after ${currentRetry} attempts`,
        patient_id: patient_id,
        all_tasks_complete: allTasksComplete,
        processed_tasks: processedTasks,
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
