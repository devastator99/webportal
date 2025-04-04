
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
    
    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: "Patient ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the auth context of the request
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );
    
    // Perform admin role check
    const { data: adminRoleData, error: adminRoleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", admin_id)
      .eq("role", "administrator")
      .single();
      
    if (adminRoleError || !adminRoleData) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Only administrators can assign care team members" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Transaction for updating assignments
    const results: Record<string, any> = {};
    
    // Handle doctor assignment
    if (doctor_id) {
      // First, delete any existing doctor assignments for this patient
      await supabaseClient
        .from("patient_doctor_assignments")
        .delete()
        .eq("patient_id", patient_id);
      
      // Then, insert the new assignment
      const { data: doctorAssignment, error: doctorError } = await supabaseClient
        .from("patient_doctor_assignments")
        .insert({ patient_id, doctor_id })
        .select()
        .single();
      
      if (doctorError) {
        results.doctorError = doctorError.message;
      } else {
        results.doctorAssigned = true;
      }
    }
    
    // Handle nutritionist assignment
    if (nutritionist_id) {
      // First, delete any existing nutritionist assignments for this patient
      await supabaseClient
        .from("patient_nutritionist_assignments")
        .delete()
        .eq("patient_id", patient_id);
      
      // Then, insert the new assignment
      const { data: nutritionistAssignment, error: nutritionistError } = await supabaseClient
        .from("patient_nutritionist_assignments")
        .insert({ patient_id, nutritionist_id })
        .select()
        .single();
      
      if (nutritionistError) {
        results.nutritionistError = nutritionistError.message;
      } else {
        results.nutritionistAssigned = true;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Care team updated successfully",
        results 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in admin-assign-care-team:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
