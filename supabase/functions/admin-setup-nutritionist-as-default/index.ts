
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
    // Create a Supabase client with the auth context
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    // Get the request body as JSON
    const requestData = await req.json();
    const adminId = requestData.admin_id;
    
    if (!adminId) {
      return new Response(
        JSON.stringify({ error: "Administrator ID is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    console.log("Admin ID:", adminId);

    // Check if the requesting user is an admin
    const { data: isAdminData, error: isAdminError } = await supabaseClient.rpc(
      'is_admin',
      { user_id: adminId }
    );
    
    if (isAdminError || !isAdminData) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Only administrators can set up default care teams" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403 
        }
      );
    }

    // Get the active doctor from the current default care team
    const { data: defaultCareTeam, error: defaultCareTeamError } = await supabaseClient
      .from('default_care_teams')
      .select('default_doctor_id')
      .eq('is_active', true)
      .single();

    if (defaultCareTeamError && defaultCareTeamError.code !== 'PGRST116') { // PGRST116 is "no rows found"
      console.error("Error getting default care team:", defaultCareTeamError);
      return new Response(
        JSON.stringify({ error: "Error retrieving default care team: " + defaultCareTeamError.message }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    const doctorId = defaultCareTeam?.default_doctor_id;
    const nutritionistId = "fda9e344-d8be-4c68-af23-e33653a54040"; // NutritionistJee's ID
    
    // Verify the nutritionist exists and has the nutritionist role
    const { data: nutritionistRole, error: nutritionistRoleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', nutritionistId)
      .eq('role', 'nutritionist')
      .single();
      
    if (nutritionistRoleError) {
      console.error("Error verifying nutritionist role:", nutritionistRoleError);
      return new Response(
        JSON.stringify({ error: "Nutritionist does not exist or does not have the nutritionist role" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Now set up the default care team with the nutritionist
    
    // First, deactivate all existing default care teams
    const { error: deactivateError } = await supabaseClient
      .from('default_care_teams')
      .update({ is_active: false })
      .eq('is_active', true);
      
    if (deactivateError) {
      console.error("Error deactivating existing default care teams:", deactivateError);
    }
    
    // Create a new default care team with the existing doctor and NutritionistJee
    const { data: insertData, error: insertError } = await supabaseClient
      .from('default_care_teams')
      .insert({
        default_doctor_id: doctorId,
        default_nutritionist_id: nutritionistId,
        is_active: true
      })
      .select()
      .single();
    
    if (insertError) {
      console.error("Error setting default care team:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create default care team: " + insertError.message }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Default care team successfully set with Nutritionist Jee",
        data: insertData
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
