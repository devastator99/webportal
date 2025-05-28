
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Environment-based demo mode detection
const isDevelopment = Deno.env.get("ENVIRONMENT") !== "production";
const DEMO_MODE = isDevelopment && !Deno.env.get("RAZORPAY_KEY_ID");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    console.log("create-registration-order function called");
    console.log("Demo mode:", DEMO_MODE);
    console.log("Environment:", Deno.env.get("ENVIRONMENT") || "development");
    
    // Get details from request
    const { user_id, amount = 500, currency = "INR" } = await req.json();
    
    console.log("Request data:", { user_id, amount, currency });
    
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
    let razorpayKeyId;
    
    if (DEMO_MODE) {
      console.log("Using DEMO mode for payment");
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
      razorpayKeyId = "rzp_test_PmVJKhNvUghZde"; // Test key for demo
    } else {
      // For production: Call Razorpay API to create an order
      const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
      const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
      
      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        console.error("Razorpay configuration missing");
        return new Response(
          JSON.stringify({ error: "Payment gateway configuration missing" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }
      
      console.log("Using production Razorpay with key:", RAZORPAY_KEY_ID.substring(0, 12) + "...");
      razorpayKeyId = RAZORPAY_KEY_ID;
      
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
          JSON.stringify({ error: "Failed to create payment order" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: response.status
          }
        );
      }
      
      orderData = await response.json();
    }
    
    console.log("Order data created:", orderData);
    
    // Create invoice record in patient_invoices table
    const { data: invoiceData, error: invoiceError } = await supabaseClient
      .from('patient_invoices')
      .insert({
        patient_id: user_id,
        amount: orderData.amount / 100,
        currency: orderData.currency,
        description: 'Registration fee',
        razorpay_order_id: orderData.id,
        invoice_number: `INV-${Date.now()}`,
        status: 'pending'
      })
      .select('id')
      .single();
    
    if (invoiceError) {
      console.error("Error creating invoice record:", invoiceError);
      // Continue anyway, not critical for the order creation
    } else {
      console.log("Invoice created:", invoiceData);
    }
    
    // Return the order data for client-side payment
    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderData.id,
        amount: orderData.amount / 100, // Convert back to regular currency units
        currency: orderData.currency,
        demo_mode: DEMO_MODE,
        razorpay_key_id: razorpayKeyId,
        invoice_id: invoiceData?.id,
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
