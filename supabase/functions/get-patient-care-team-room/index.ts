
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to get a patient's care team room
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patient_id } = await req.json();

    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: "Patient ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Received request for patient_id:", patient_id);

    // Create a Supabase client with the auth context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    // First try to find an existing care team room
    const { data: existingRoom, error: roomError } = await supabaseClient
      .from('chat_rooms')
      .select('id')
      .eq('patient_id', patient_id)
      .eq('room_type', 'care_team')
      .eq('is_active', true)
      .single();
    
    if (existingRoom) {
      console.log("Found existing care team room:", existingRoom.id);
      return new Response(
        JSON.stringify({ room_id: existingRoom.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If no existing room, try to create one using the RPC function
    console.log("No existing room found, calling get_patient_care_team_room RPC");
    const { data: roomId, error: rpcError } = await supabaseClient
      .rpc('get_patient_care_team_room', { p_patient_id: patient_id });
    
    if (rpcError) {
      console.error("Error fetching patient care team room:", rpcError);
      return new Response(
        JSON.stringify({ error: rpcError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Room ID from RPC:", roomId);
    return new Response(
      JSON.stringify({ room_id: roomId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-patient-care-team-room:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
