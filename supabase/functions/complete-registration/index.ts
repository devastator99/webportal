
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
    
    // Call RPC function to complete registration and queue tasks
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
    
    console.log("Registration tasks queued:", data);
    
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
        body: JSON.stringify({}),
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
              body: JSON.stringify({}),
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
            body: JSON.stringify({}),
          });
        } catch (delayedError) {
          console.error("Delayed task processing also failed:", delayedError);
        }
      }, 2000);
    }
    
    // Return success response immediately, without waiting for background tasks
    return new Response(
      JSON.stringify({
        success: true,
        message: "Registration payment completed successfully. Multi-channel notifications are being sent.",
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
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
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
