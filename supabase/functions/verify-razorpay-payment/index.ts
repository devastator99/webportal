
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Environment-based configuration
const isDevelopment = Deno.env.get("ENVIRONMENT") !== "production";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

// Function to verify Razorpay signature
const verifyRazorpaySignature = (orderId: string, paymentId: string, signature: string) => {
  if (!RAZORPAY_KEY_SECRET) {
    console.warn("Razorpay key secret not configured, skipping signature verification");
    return true; // Allow in demo mode
  }
  
  try {
    // Create HMAC SHA256 instance with the secret key
    const hmac = createHmac("sha256", RAZORPAY_KEY_SECRET);
    
    // Update with the ordered data string (orderId + "|" + paymentId)
    hmac.update(`${orderId}|${paymentId}`);
    
    // Get the generated signature
    const generatedSignature = hmac.digest("hex");
    
    // Compare the signatures
    return generatedSignature === signature;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Get the payment verification details from the request
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      patient_id
    } = await req.json();
    
    console.log("Verifying payment:", {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature_present: !!razorpay_signature,
      environment: isDevelopment ? "development" : "production"
    });
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing required payment verification parameters" }),
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
    
    // Only verify signature for real Razorpay payments, not demo ones
    let isSignatureValid = true;
    if (!razorpay_payment_id.startsWith("pay_demo_") && !razorpay_payment_id.startsWith("test_payment_")) {
      isSignatureValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );
      
      if (!isSignatureValid) {
        console.error("Invalid payment signature for production payment");
        return new Response(
          JSON.stringify({ error: "Invalid payment signature" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }
    } else {
      console.log("Skipping signature verification for demo/test payment");
    }
    
    // Update the invoice status to 'paid'
    const { data: updateData, error: updateError } = await supabaseClient
      .from('patient_invoices')
      .update({
        status: 'paid',
        payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select('id, invoice_number')
      .single();
    
    if (updateError) {
      console.error("Error updating invoice status:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update invoice status" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    console.log("Payment verified successfully:", {
      invoice_id: updateData?.id,
      invoice_number: updateData?.invoice_number,
      payment_id: razorpay_payment_id
    });
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
        invoice_id: updateData?.id,
        invoice_number: updateData?.invoice_number
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("Error in verify-razorpay-payment function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
