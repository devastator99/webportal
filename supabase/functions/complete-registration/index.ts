
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
    
    // Check if there's a default care team available
    const { data: careTeamData, error: careTeamError } = await supabaseClient
      .from('default_care_teams')
      .select('default_doctor_id, default_nutritionist_id')
      .eq('is_active', true)
      .single();
      
    if (careTeamError || !careTeamData) {
      console.error("Error getting default care team:", careTeamError);
      return new Response(
        JSON.stringify({ error: "No default care team available" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    console.log("Default care team found:", careTeamData);
    
    if (!careTeamData.default_doctor_id) {
      return new Response(
        JSON.stringify({ error: "Default care team is incomplete. Contact administrator." }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    // Use a nutritionist ID even if missing from default care team
    const nutritionistId = careTeamData.default_nutritionist_id || "00000000-0000-0000-0000-000000000000";

    // Start async task for care team assignment and chat room creation
    EdgeRuntime.waitUntil(async () => {
      try {
        console.log("Starting background task to assign care team and create chat room");
        
        // Call the RPC function to complete registration
        const { data, error } = await supabaseClient.rpc(
          'complete_patient_registration',
          {
            p_user_id: user_id,
            p_payment_id: razorpay_payment_id,
            p_razorpay_order_id: razorpay_order_id,
            p_razorpay_payment_id: razorpay_payment_id,
            p_doctor_id: careTeamData.default_doctor_id,
            p_nutritionist_id: nutritionistId
          }
        );
        
        if (error) {
          console.error("Error in background task - Failed to complete registration:", error);
          return;
        }
        
        console.log("Background task completed successfully:", data);
        
        // Send notification to patient about successful registration and care team assignment
        await supabaseClient.functions.invoke('send-ai-care-team-message', {
          body: {
            patient_id: user_id,
            title: "Welcome to AnubhootiHealth",
            message: "Your registration is complete and your care team has been assigned. You can now communicate with your doctor and nutritionist through this chat.",
          }
        }).catch(err => {
          console.error("Failed to send welcome message:", err);
        });
      } catch (err) {
        console.error("Unexpected error in background task:", err);
      }
    });
    
    // Return immediate success response without waiting for background tasks
    return new Response(
      JSON.stringify({
        success: true,
        message: "Registration payment completed successfully",
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id
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
