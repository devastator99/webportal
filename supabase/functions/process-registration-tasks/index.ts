
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
    // Get optional patient filter from request body
    let patientFilter = null;
    try {
      const body = await req.json();
      patientFilter = body?.patient_id || null;
    } catch (e) {
      console.log("No request body or invalid JSON, processing all pending tasks");
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase connection parameters");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Starting enhanced registration task processor...", 
      patientFilter ? `for patient: ${patientFilter}` : "for all patients");
    
    // If a specific patient is provided, delegate to the trigger function for better handling
    if (patientFilter) {
      console.log(`Delegating to trigger-registration-notifications for patient: ${patientFilter}`);
      
      const { data, error } = await supabase.functions.invoke('trigger-registration-notifications', {
        body: { patient_id: patientFilter }
      });
      
      if (error) {
        console.error("Error calling trigger function:", error);
        throw new Error(`Failed to process tasks for patient ${patientFilter}: ${error.message}`);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Tasks processed for patient ${patientFilter}`,
          result: data
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    // For general processing, get the next pending task
    const { data: taskData, error: taskError } = await supabase.rpc(
      'get_next_pending_registration_task'
    );
    
    if (taskError) {
      console.error("Task fetch error:", taskError);
      throw new Error(`Failed to get next task: ${taskError.message}`);
    }
    
    if (!taskData || taskData.length === 0) {
      console.log("No pending tasks found globally");
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "No pending tasks found"
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    // Process the next task by calling the trigger function for that patient
    const task = taskData[0];
    console.log(`Found pending task for patient ${task.user_id}, delegating to trigger function`);
    
    const { data, error } = await supabase.functions.invoke('trigger-registration-notifications', {
      body: { patient_id: task.user_id }
    });
    
    if (error) {
      console.error("Error processing patient tasks:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          patient_id: task.user_id
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Tasks processed for patient ${task.user_id}`,
        patient_id: task.user_id,
        result: data
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error: any) {
    console.error("Error in process-registration-tasks:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
