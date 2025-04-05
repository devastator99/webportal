
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
    console.log("Edge function received request");
    
    // Parse request body and log it for debugging
    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody));
    
    const { patient_id, doctor_id, nutritionist_id, admin_id } = requestBody;
    
    console.log("Extracted parameters:", { 
      patient_id, 
      doctor_id, 
      nutritionist_id: nutritionist_id || "Not provided", 
      admin_id 
    });
    
    // Input validation
    if (!patient_id) {
      console.log("Error: Patient ID is required");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Patient ID is required" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!doctor_id) {
      console.log("Error: Doctor ID is required");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Doctor ID is required" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!admin_id) {
      console.log("Error: Admin ID is required");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Admin ID is required" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating Supabase client");
    
    // Create a Supabase client with the auth context of the request
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );
    
    console.log("Checking admin role");
    
    // Perform admin role check
    const { data: adminRoleData, error: adminRoleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", admin_id)
      .eq("role", "administrator")
      .single();
      
    if (adminRoleError) {
      console.log("Admin role check error:", adminRoleError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Error verifying administrator role: " + adminRoleError.message 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!adminRoleData) {
      console.log("Unauthorized: Not an admin");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Unauthorized: Only administrators can assign care team members" 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Admin role verified, proceeding with assignment");
    
    // Delete any existing assignments for this patient
    const { error: deleteError } = await supabaseClient
      .from("patient_assignments")
      .delete()
      .eq("patient_id", patient_id);
      
    if (deleteError) {
      console.log("Error deleting existing assignments:", deleteError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Error removing existing assignments: " + deleteError.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Creating new assignment");
    
    // Create new assignment with doctor and nutritionist (if provided)
    const assignmentData = {
      patient_id: patient_id,
      doctor_id: doctor_id,
      nutritionist_id: nutritionist_id || null
    };
    
    console.log("Assignment data:", assignmentData);
    
    const { data, error: assignmentError } = await supabaseClient
      .from("patient_assignments")
      .insert(assignmentData)
      .select()
      .single();
    
    if (assignmentError) {
      console.log("Error creating assignment:", assignmentError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Error creating assignment: " + assignmentError.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Assignment created successfully:", data);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Care team assigned successfully",
        data: data
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Unhandled error in admin-assign-care-team:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
