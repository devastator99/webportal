
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define the Razorpay API endpoint
const RAZORPAY_API_URL = "https://api.razorpay.com/v1/orders";

// Razorpay API key and secret (these should be set in the Edge Function secrets)
const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

// Function to generate a unique receipt ID
const generateReceiptId = () => {
  return "rcpt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 15);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Get the request body
    const { patient_id, patient_name, doctor_id, amount } = await req.json();
    
    if (!patient_id || !amount) {
      return new Response(
        JSON.stringify({ error: "Patient ID and amount are required" }),
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
    
    // First, check if there are pending invoices for this patient
    const { data: invoices, error: invoiceError } = await supabaseClient
      .from('patient_invoices')
      .select('id, invoice_number, amount')
      .eq('patient_id', patient_id)
      .eq('status', 'pending')
      .limit(1);
    
    if (invoiceError) {
      console.error("Error fetching invoices:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Failed to check for existing invoices" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    // If no pending invoices, create one
    let invoiceId, invoiceNumber;
    
    if (!invoices || invoices.length === 0) {
      // Create an invoice
      const { data: invoiceData, error: createInvoiceError } = await supabaseClient.rpc(
        'generate_patient_invoice',
        {
          p_patient_id: patient_id,
          p_doctor_id: doctor_id,
          p_amount: amount / 100, // Convert back to rupees from paise
          p_description: "Medical consultation fees"
        }
      );
      
      if (createInvoiceError) {
        console.error("Error creating invoice:", createInvoiceError);
        return new Response(
          JSON.stringify({ error: "Failed to create invoice" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }
      
      // Get the created invoice details
      const { data: newInvoice, error: fetchError } = await supabaseClient
        .from('patient_invoices')
        .select('id, invoice_number')
        .eq('id', invoiceData)
        .single();
      
      if (fetchError || !newInvoice) {
        console.error("Error fetching new invoice:", fetchError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch invoice details" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }
      
      invoiceId = newInvoice.id;
      invoiceNumber = newInvoice.invoice_number;
    } else {
      // Use existing invoice
      invoiceId = invoices[0].id;
      invoiceNumber = invoices[0].invoice_number;
    }
    
    // Create Razorpay order
    const authString = `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`;
    const encodedAuth = btoa(authString);
    
    const orderData = {
      amount: amount,
      currency: "INR",
      receipt: invoiceNumber,
      notes: {
        patient_id: patient_id,
        invoice_id: invoiceId,
        patient_name: patient_name
      }
    };
    
    console.log("Creating Razorpay order:", orderData);
    
    const response = await fetch(RAZORPAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${encodedAuth}`
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      const errorResponse = await response.json();
      console.error("Razorpay API error:", errorResponse);
      return new Response(
        JSON.stringify({ error: "Failed to create Razorpay order", details: errorResponse }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status 
        }
      );
    }
    
    const razorpayOrder = await response.json();
    
    // Update the invoice with the Razorpay order ID
    const { error: updateError } = await supabaseClient
      .from('patient_invoices')
      .update({
        razorpay_order_id: razorpayOrder.id,
        status: 'pending'
      })
      .eq('id', invoiceId);
    
    if (updateError) {
      console.error("Error updating invoice with order ID:", updateError);
    }
    
    // Return the order details to the client
    return new Response(
      JSON.stringify({
        ...razorpayOrder,
        key_id: RAZORPAY_KEY_ID,
        invoice_id: invoiceId
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("Error in create-razorpay-order function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
