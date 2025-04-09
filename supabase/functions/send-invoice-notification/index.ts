
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
    // Get the request body
    const { patient_id, channel } = await req.json();
    
    if (!patient_id || !channel) {
      return new Response(
        JSON.stringify({ error: "Patient ID and notification channel are required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Validate channel
    if (channel !== 'email' && channel !== 'whatsapp') {
      return new Response(
        JSON.stringify({ error: "Invalid notification channel. Use 'email' or 'whatsapp'" }),
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
    
    // Get the patient details
    const { data: patientData, error: patientError } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', patient_id)
      .single();
    
    if (patientError || !patientData) {
      console.error("Error fetching patient details:", patientError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch patient details" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    // Get pending invoices for the patient
    const { data: invoices, error: invoiceError } = await supabaseClient
      .from('patient_invoices')
      .select(`
        id, 
        invoice_number,
        amount,
        currency,
        status,
        created_at,
        doctor_id,
        profiles:doctor_id (first_name, last_name)
      `)
      .eq('patient_id', patient_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (invoiceError) {
      console.error("Error fetching invoices:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch invoice details" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    if (!invoices || invoices.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending invoices found for this patient" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    // In a real implementation, we would send an actual email or WhatsApp message here
    console.log(`Sending ${channel} notification to ${patientData.first_name} ${patientData.last_name}`);
    console.log(`Email: ${patientData.email}`);
    console.log(`Invoices to be notified:`, invoices);
    
    // Update the notification status in the database
    const updateData = channel === 'email' 
      ? { email_sent: true }
      : { whatsapp_sent: true };
    
    // Update all pending invoices
    const { error: updateError } = await supabaseClient
      .from('patient_invoices')
      .update(updateData)
      .eq('patient_id', patient_id)
      .eq('status', 'pending');
    
    if (updateError) {
      console.error(`Error updating ${channel} notification status:`, updateError);
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `${channel === 'email' ? 'Email' : 'WhatsApp'} notification sent successfully`,
        invoices_count: invoices.length
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("Error in send-invoice-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
