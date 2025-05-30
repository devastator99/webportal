
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
    
    // Enhanced automatic task processing with multiple attempts
    console.log("Starting automatic task processing for user:", user_id);
    
    // Use EdgeRuntime.waitUntil for background processing
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(
        processTasksWithRetries(user_id)
      );
    } else {
      // Fallback: start processing immediately without waiting
      processTasksWithRetries(user_id).catch(error => {
        console.error("Background task processing failed:", error);
      });
    }
    
    // Return success response immediately
    return new Response(
      JSON.stringify({
        success: true,
        message: "Registration payment completed successfully. Tasks are being processed automatically.",
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        tasks: data?.tasks || [],
        processing_status: "automatic_processing_initiated"
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

// Enhanced background task processing with retries
async function processTasksWithRetries(userId: string, maxRetries = 5) {
  console.log(`Starting automatic task processing for user ${userId} with ${maxRetries} retries`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Task processing attempt ${attempt}/${maxRetries} for user ${userId}`);
      
      // Wait a bit before each attempt (except the first)
      if (attempt > 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Exponential backoff, max 30s
        console.log(`Waiting ${delay}ms before retry ${attempt}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Call the trigger function
      const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/trigger-registration-notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ patient_id: userId }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Task processing attempt ${attempt} successful:`, result);
        
        // Check if all tasks are completed
        if (result.successful_tasks >= 2) { // We expect assign_care_team, create_chat_room, send_welcome_notification
          console.log(`All tasks completed successfully for user ${userId}`);
          return result;
        } else {
          console.log(`Some tasks still pending for user ${userId}, will retry`);
          if (attempt === maxRetries) {
            console.error(`Max retries reached for user ${userId}, some tasks may still be pending`);
          }
        }
      } else {
        const errorText = await response.text();
        console.error(`Task processing attempt ${attempt} failed:`, response.status, errorText);
        
        if (attempt === maxRetries) {
          throw new Error(`All ${maxRetries} task processing attempts failed for user ${userId}`);
        }
      }
    } catch (error) {
      console.error(`Task processing attempt ${attempt} exception:`, error);
      
      if (attempt === maxRetries) {
        console.error(`Final attempt failed for user ${userId}:`, error);
        // Don't throw here, let it complete with partial success
      }
    }
  }
}
