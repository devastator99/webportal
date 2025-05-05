
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Demo mode flag
const DEMO_MODE = true; // Set to false for production with real Razorpay

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Get details from request
    const { user_id, amount = 500, currency = "INR" } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );
    
    // Get user profile info
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user_id)
      .single();
    
    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }
    
    // Generate a unique receipt ID
    const receipt = `reg_${Date.now()}_${user_id.substring(0, 8)}`;
    
    let orderData;
    
    if (DEMO_MODE) {
      // For demo/testing: generate mock order data
      orderData = {
        id: `order_demo_${Date.now()}`,
        amount: amount * 100,
        currency: currency,
        receipt: receipt,
        notes: {
          user_id: user_id
        }
      };
    } else {
      // For production: Call Razorpay API to create an order
      const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
      const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
      
      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return new Response(
          JSON.stringify({ error: "Razorpay configuration missing" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }
      
      const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
      
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`
        },
        body: JSON.stringify({
          amount: amount * 100, // Razorpay expects amount in paise
          currency: currency,
          receipt: receipt,
          notes: {
            user_id: user_id
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Razorpay API error:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to create Razorpay order" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: response.status
          }
        );
      }
      
      orderData = await response.json();
    }
    
    // Record the order in registration_status table
    await supabaseClient
      .from('registration_status')
      .insert({
        user_id: user_id,
        payment_status: 'pending',
        razorpay_order_id: orderData.id
      })
      .onConflict('user_id')
      .merge();
    
    // Return the order data for client-side payment
    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderData.id,
        amount: orderData.amount / 100, // Convert back to regular currency units
        currency: orderData.currency,
        demo_mode: DEMO_MODE,
        prefill: {
          name: `${profile.first_name} ${profile.last_name}`.trim(),
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("Error in create-registration-order function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
