
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

    // Get authenticated user
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError) {
      console.error("Error getting user:", userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    console.log("User authenticated:", userData.user.id);

    // Check if user has admin permission using our security definer function
    const { data: isAdmin, error: adminCheckError } = await supabaseClient
      .rpc('user_can_sync_rooms');

    if (adminCheckError) {
      console.error("Error checking admin permission:", adminCheckError);
      throw new Error(`Admin permission check failed: ${adminCheckError.message}`);
    }
    
    console.log("User admin status:", isAdmin);

    // Only allow administrators to run this function
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Only administrators can sync care team rooms" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log current patient assignments before syncing
    console.log("Fetching all patient assignments...");
    const { data: patientAssignments, error: paError } = await supabaseClient
      .from('patient_assignments')
      .select('id, patient_id, doctor_id, nutritionist_id');
      
    if (paError) {
      console.error("Error fetching patient assignments:", paError);
      throw new Error(`Failed to fetch patient assignments: ${paError.message}`);
    } else {
      console.log(`Found ${patientAssignments?.length || 0} patient assignments`);
      if (patientAssignments && patientAssignments.length > 0) {
        console.log("Sample assignments:", JSON.stringify(patientAssignments.slice(0, 5)));
      } else {
        console.log("No patient assignments found - this is likely the issue!");
        // Return more helpful error message if no assignments exist
        return new Response(
          JSON.stringify({ 
            error: "No patient assignments found. Please create patient assignments first." 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check if we can access the profiles table
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, first_name, last_name')
      .limit(5);
      
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw new Error(`Failed to access profiles table: ${profilesError.message}`);
    } else {
      console.log(`Found ${profiles?.length || 0} profiles`);
      console.log("Sample profiles:", JSON.stringify(profiles));
    }

    // Call the RPC function to sync all care team rooms
    console.log("Calling sync_all_care_team_rooms RPC function");
    const { data, error } = await supabaseClient.rpc('sync_all_care_team_rooms');
    
    if (error) {
      console.error("Error calling sync_all_care_team_rooms:", error);
      throw new Error(`Failed to sync care team rooms: ${error.message}`);
    }

    console.log(`Sync completed, created/updated ${data?.length || 0} rooms`);
    if (data && data.length > 0) {
      console.log("Room IDs:", JSON.stringify(data));
    } else {
      console.log("No rooms were created or updated - check if the SQL function executed correctly");
    }

    // Try to fetch the created rooms to confirm they exist
    if (data && data.length > 0) {
      const { data: roomsData, error: roomsError } = await supabaseClient
        .from('chat_rooms')
        .select('id, name, room_type, patient_id')
        .in('id', data);
        
      if (roomsError) {
        console.error("Error fetching created rooms:", roomsError);
      } else {
        console.log(`Verified ${roomsData?.length || 0} rooms exist:`, JSON.stringify(roomsData));
      }
    }

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
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
