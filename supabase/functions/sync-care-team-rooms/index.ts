
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting sync-care-team-rooms edge function");
    
    // Create a Supabase client with the auth context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    // Get admin status
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError) {
      console.error("Error getting user:", userError);
      throw userError;
    }
    
    console.log("User authenticated:", userData.user.id);

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (roleError) {
      console.error("Error getting user role:", roleError);
      throw roleError;
    }
    
    console.log("User role:", roleData.role);

    // Only allow administrators to run this function
    if (roleData.role !== 'administrator') {
      return new Response(
        JSON.stringify({ error: "Only administrators can sync care team rooms" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching all patient assignments...");
    
    // Log current patient assignments before syncing
    const { data: patientAssignments, error: paError } = await supabaseClient
      .from('patient_assignments')
      .select('patient_id, doctor_id, nutritionist_id');
      
    if (paError) {
      console.error("Error fetching patient assignments:", paError);
    } else {
      console.log(`Found ${patientAssignments?.length || 0} patient assignments`);
      console.log("Patient assignments:", JSON.stringify(patientAssignments));
    }

    // Call the RPC function to sync all care team rooms
    console.log("Calling sync_all_care_team_rooms RPC function");
    const { data, error } = await supabaseClient.rpc('sync_all_care_team_rooms');
    
    if (error) {
      console.error("Error calling sync_all_care_team_rooms:", error);
      throw error;
    }

    console.log(`Sync completed, created/updated ${data?.length || 0} rooms`);
    console.log("Room IDs:", JSON.stringify(data));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${data?.length || 0} care team rooms`,
        rooms: data 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in sync-care-team-rooms:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
