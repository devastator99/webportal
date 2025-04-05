
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patient_id, nutritionist_id, admin_id } = await req.json();
    
    if (!patient_id || !nutritionist_id) {
      return new Response(
        JSON.stringify({ error: "Patient ID and nutritionist ID are required" }),
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

    console.log("Calling RPC function admin_assign_nutritionist_to_patient");
    
    // Use the security definer RPC function
    const { data, error } = await supabaseClient.rpc(
      'admin_assign_nutritionist_to_patient',
      { 
        p_nutritionist_id: nutritionist_id,
        p_patient_id: patient_id,
        p_admin_id: admin_id || null
      }
    );
    
    console.log("RPC response:", { data, error });
    
    if (error) {
      console.error("Error calling admin_assign_nutritionist_to_patient RPC:", error);
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
        message: "Nutritionist assigned to patient successfully" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-assign-nutritionist-to-patient:", error);
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
