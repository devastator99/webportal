
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
    console.log("complete-registration function called");
    
    // Get payment and user details from request
    const { 
      user_id,
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = await req.json();
    
    console.log("Request data:", { 
      user_id,
      razorpay_order_id, 
      razorpay_payment_id
    });
    
    if (!user_id || !razorpay_order_id || !razorpay_payment_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );
    
    // Call enhanced RPC function to complete registration and queue tasks
    const { data, error } = await supabaseClient.rpc(
      'complete_patient_registration',
      {
        p_user_id: user_id,
        p_payment_id: razorpay_payment_id,
        p_razorpay_order_id: razorpay_order_id,
        p_razorpay_payment_id: razorpay_payment_id
      }
    );
    
    if (error) {
      console.error("Error completing registration:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    // Check if the RPC function returned an error
    if (data && typeof data === 'object' && data.success === false) {
      console.error("Registration function returned error:", data.error);
      return new Response(
        JSON.stringify({ error: data.error }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    console.log("Registration completed successfully:", data);
    
    // Enhanced task processing trigger with better error handling
    console.log("Triggering background task processing...");
    try {
      // Try to trigger task processing immediately
      const processResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/process-registration-tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ user_id: user_id }),
      });
      
      if (processResponse.ok) {
        const processResult = await processResponse.json();
        console.log("Task processing triggered successfully:", processResult);
      } else {
        const errorText = await processResponse.text();
        console.error("Task processing trigger failed:", errorText);
        
        // Try with EdgeRuntime.waitUntil as fallback
        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
          EdgeRuntime.waitUntil(
            fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/process-registration-tasks`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({ user_id: user_id }),
            }).catch(err => {
              console.error("Background task processor fallback failed:", err);
            })
          );
        }
      }
    } catch (triggerError) {
      console.error("Failed to trigger task processor:", triggerError);
      
      // Last resort: try to call the process function directly after a delay
      setTimeout(async () => {
        try {
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/process-registration-tasks`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ user_id: user_id }),
          });
        } catch (delayedError) {
          console.error("Delayed task processing also failed:", delayedError);
        }
      }, 2000);
    }
    
    // Return enhanced success response with detailed information
    return new Response(
      JSON.stringify({
        success: true,
        message: "Registration payment completed successfully. Profile status updated and tasks are being processed.",
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        profile_updated: data?.profile_updated || false,
        patient_details_created: data?.patient_details_created || false,
        tasks_created: Array.isArray(data?.tasks) ? data.tasks.length : 0,
        tasks: data?.tasks || [],
        notification_channels: ["SMS", "Email", "WhatsApp", "Care Team Chat"]
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("Error in complete-registration function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "An unexpected error occurred during registration completion"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
