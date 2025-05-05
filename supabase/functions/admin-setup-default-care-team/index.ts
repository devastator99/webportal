
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
    // Get default care team details from request
    const { 
      doctor_id,
      nutritionist_id,
      admin_id
    } = await req.json();
    
    if (!doctor_id || !admin_id) {
      return new Response(
        JSON.stringify({ error: "Doctor ID and Admin ID are required" }),
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
    
    // First, check if the requesting user is an admin
    const { data: isAdminData, error: isAdminError } = await supabaseClient.rpc(
      'is_admin',
      { user_id: admin_id }
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
    
    // Deactivate all existing default care teams
    const { error: deactivateError } = await supabaseClient
      .from('default_care_teams')
      .update({ is_active: false })
      .eq('is_active', true);
      
    if (deactivateError) {
      console.error("Error deactivating existing default care teams:", deactivateError);
    }
    
    // Create a new default care team
    const { data: insertData, error: insertError } = await supabaseClient
      .from('default_care_teams')
      .insert({
        default_doctor_id: doctor_id,
        default_nutritionist_id: nutritionist_id,
        is_active: true
      })
      .select('id')
      .single();
      
    if (insertError) {
      console.error("Error inserting new default care team:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
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
        message: "Default care team set up successfully",
        id: insertData?.id
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("Error in admin-setup-default-care-team function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
