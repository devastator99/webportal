
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patient_id, doctor_id, admin_id } = await req.json();
    
    console.log("Edge function received request:", { patient_id, doctor_id, admin_id });
    
    if (!patient_id || !doctor_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Patient ID and doctor ID are required" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the auth context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    console.log("Calling RPC function admin_assign_doctor_to_patient");
    
    // Call the RPC function with parameters
    const { data, error } = await supabaseClient.rpc(
      'admin_assign_doctor_to_patient',
      { 
        p_doctor_id: doctor_id,
        p_patient_id: patient_id,
        p_admin_id: admin_id 
      }
    );
    
    console.log("RPC response:", { data, error });
    
    if (error) {
      console.error("Error calling admin_assign_doctor_to_patient RPC:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          details: error 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check the result from the RPC function
    if (data && !data.success) {
      return new Response(
        JSON.stringify(data),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data || { 
        success: true, 
        message: "Doctor assigned to patient successfully" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-assign-doctor-to-patient:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
