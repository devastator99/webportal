
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
    const { patient_id, doctor_id, nutritionist_id, admin_id } = await req.json();
    
    console.log("Edge function received request:", { patient_id, doctor_id, nutritionist_id, admin_id });
    
    if (!patient_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Patient ID is required" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!doctor_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Doctor ID is required" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!admin_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Administrator ID is required" 
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

    // First, verify that the admin_id has the administrator role
    const { data: adminRoleData, error: adminRoleError } = await supabaseClient.rpc(
      'check_admin_role',
      { user_id: admin_id }
    );
    
    if (adminRoleError || !adminRoleData) {
      console.error("Error checking admin role:", adminRoleError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized: Only administrators can assign care teams",
          details: adminRoleError
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin role verification passed");

    // Use admin_assign_care_team RPC function to handle both assignments at once
    console.log("Calling RPC function admin_assign_care_team");
    
    const { data, error } = await supabaseClient.rpc(
      'admin_assign_care_team',
      { 
        p_patient_id: patient_id,
        p_doctor_id: doctor_id,
        p_nutritionist_id: nutritionist_id, 
        p_admin_id: admin_id
      }
    );
    
    console.log("RPC response:", { data, error });
    
    if (error) {
      console.error("Error calling admin_assign_care_team RPC:", error);
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
        message: "Care team assigned to patient successfully" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-assign-care-team:", error);
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
