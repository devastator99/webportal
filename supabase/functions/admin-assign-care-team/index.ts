
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
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Edge function received request:", body);
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid JSON in request body",
          details: parseError.message
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { patient_id, doctor_id, nutritionist_id, admin_id } = body;
    
    // Validate required parameters
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

    // Create a Supabase client
    let supabaseClient;
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables");
      }
      
      supabaseClient = createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          global: { headers: { Authorization: req.headers.get("Authorization")! } },
        }
      );
      
      console.log("Supabase client created successfully");
    } catch (clientError) {
      console.error("Error creating Supabase client:", clientError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to initialize database connection",
          details: clientError.message
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify that the admin_id has the administrator role
    let adminCheckResult;
    try {
      const { data: adminRoleData, error: adminRoleError } = await supabaseClient.rpc(
        'check_admin_role',
        { user_id: admin_id }
      );
      
      adminCheckResult = { data: adminRoleData, error: adminRoleError };
      console.log("Admin role check result:", adminCheckResult);
      
      if (adminRoleError) {
        throw adminRoleError;
      }
      
      if (!adminRoleData) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Unauthorized: Only administrators can assign care teams"
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (adminCheckError) {
      console.error("Error checking admin role:", adminCheckError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to verify administrator privileges",
          details: adminCheckError.message || adminCheckError
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the RPC function to assign care team
    let rpcResult;
    try {
      console.log("Calling RPC function admin_assign_care_team with params:", { 
        p_patient_id: patient_id,
        p_doctor_id: doctor_id,
        p_nutritionist_id: nutritionist_id, 
        p_admin_id: admin_id
      });
      
      const { data, error } = await supabaseClient.rpc(
        'admin_assign_care_team',
        { 
          p_patient_id: patient_id,
          p_doctor_id: doctor_id,
          p_nutritionist_id: nutritionist_id, 
          p_admin_id: admin_id
        }
      );
      
      rpcResult = { data, error };
      console.log("RPC response:", rpcResult);
      
      if (error) {
        throw error;
      }
      
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
    } catch (rpcError) {
      console.error("Error calling admin_assign_care_team RPC:", rpcError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: rpcError.message || "Error assigning care team",
          details: rpcError
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Unhandled error in admin-assign-care-team:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "An unexpected error occurred",
        message: error.message || "Unknown error",
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
