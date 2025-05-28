
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
    
    // FIXED: Process all tasks independently instead of one at a time
    const processedTasks = [];
    const failedTasks = [];
    
    // Process each task independently
    for (const task of pendingTasks) {
      console.log(`Processing task ${task.task_type} for patient ${patient_id}`);
      
      try {
        // Call the task processor for this specific task
        const { data: processResult, error: processError } = await supabase.functions.invoke(
          'process-registration-tasks',
          { body: { patient_id: patient_id } }
        );
        
        if (processError) {
          console.error(`Error processing task ${task.task_type}:`, processError);
          failedTasks.push({
            task_id: task.id,
            task_type: task.task_type,
            error: processError.message
          });
        } else if (processResult?.success) {
          console.log(`Task ${task.task_type} processed successfully`);
          processedTasks.push({
            task_id: processResult.task_id || task.id,
            task_type: processResult.task_type || task.task_type,
            status: 'completed'
          });
        } else {
          console.log(`Task ${task.task_type} processing returned false success`);
          failedTasks.push({
            task_id: task.id,
            task_type: task.task_type,
            error: processResult?.error || 'Unknown error'
          });
        }
      } catch (error: any) {
        console.error(`Exception processing task ${task.task_type}:`, error);
        failedTasks.push({
          task_id: task.id,
          task_type: task.task_type,
          error: error.message
        });
      }
      
      // Small delay between tasks to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Get final status for this patient
    const { data: finalStatus, error: statusError } = await supabase.rpc(
      'get_user_registration_status_safe',
      { p_user_id: patient_id }
    );
    
    const totalTasks = pendingTasks.length;
    const successfulTasks = processedTasks.length;
    const failedTasksCount = failedTasks.length;
    
    console.log(`Task processing summary for patient ${patient_id}: ${successfulTasks}/${totalTasks} successful, ${failedTasksCount} failed`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${totalTasks} tasks for patient ${patient_id}: ${successfulTasks} successful, ${failedTasksCount} failed`,
        patient_id: patient_id,
        total_tasks: totalTasks,
        successful_tasks: successfulTasks,
        failed_tasks: failedTasksCount,
        processed_tasks: processedTasks,
        failed_task_details: failedTasks,
        final_status: finalStatus,
        all_tasks_completed: failedTasksCount === 0
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
