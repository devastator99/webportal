
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
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) {
      console.error("Error getting user:", userError);
      return new Response(
        JSON.stringify({ error: `Authentication error: ${userError.message}` }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("User authenticated:", user.id);

    // Check if user has admin permission using the user_can_sync_rooms function
    const { data: canSyncRooms, error: permissionError } = await supabaseClient.rpc('user_can_sync_rooms');
    
    if (permissionError) {
      console.error("Error checking permission:", permissionError);
      return new Response(
        JSON.stringify({ error: `Permission check failed: ${permissionError.message}` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("User sync permission:", canSyncRooms);

    // Only allow administrators to run this function
    if (!canSyncRooms) {
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
      return new Response(
        JSON.stringify({ error: `Failed to fetch patient assignments: ${paError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!patientAssignments || patientAssignments.length === 0) {
      console.log("No patient assignments found");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No patient assignments found to sync", 
          rooms: [],
          results: []
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Found ${patientAssignments.length} patient assignments`);
    console.log("Sample assignments:", JSON.stringify(patientAssignments.slice(0, 5)));

    // Fetch all existing care team rooms for reference
    const { data: existingRooms, error: existingRoomsError } = await supabaseClient
      .from('chat_rooms')
      .select('id, patient_id')
      .eq('room_type', 'care_team');
      
    if (existingRoomsError) {
      console.error("Error fetching existing care team rooms:", existingRoomsError);
      // Continue with the process despite the error
    }
    
    console.log(`Found ${existingRooms?.length || 0} existing care team rooms`);
    
    // Create a map for faster lookup of existing rooms by patient_id
    const existingRoomsByPatient = new Map();
    if (existingRooms && existingRooms.length > 0) {
      existingRooms.forEach(room => {
        if (room.patient_id) {
          existingRoomsByPatient.set(room.patient_id, room.id);
        }
      });
    }

    // Process each patient assignment to ensure care team rooms exist
    const createdRooms = [];
    const results = [];
    
    for (const assignment of patientAssignments) {
      try {
        if (!assignment.patient_id || !assignment.doctor_id) {
          console.log("Skipping invalid assignment:", assignment);
          results.push({
            patient_id: assignment.patient_id,
            status: "skipped",
            reason: "Missing patient_id or doctor_id"
          });
          continue;
        }
        
        // Get patient name
        const { data: patientData, error: patientError } = await supabaseClient
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', assignment.patient_id)
          .maybeSingle();
          
        if (patientError || !patientData) {
          console.error(`Error fetching patient ${assignment.patient_id}:`, patientError || "No data returned");
          results.push({
            patient_id: assignment.patient_id,
            status: "error",
            reason: patientError ? `Error fetching patient data: ${patientError.message}` : "No patient profile found"
          });
          continue;
        }
        
        const patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
        if (!patientName) {
          console.log(`Skipping patient with empty name: ${assignment.patient_id}`);
          results.push({
            patient_id: assignment.patient_id,
            status: "skipped",
            reason: "Patient name is empty"
          });
          continue;
        }
        
        // Call create_care_team_room RPC function
        console.log(`Creating/updating room for patient: ${patientName} (${assignment.patient_id})`);
        const { data: roomData, error: roomError } = await supabaseClient.rpc(
          'create_care_team_room',
          {
            p_patient_id: assignment.patient_id,
            p_doctor_id: assignment.doctor_id,
            p_nutritionist_id: assignment.nutritionist_id
          }
        );
        
        if (roomError) {
          console.error(`Error creating room for patient ${assignment.patient_id}:`, roomError);
          results.push({
            patient_id: assignment.patient_id,
            status: "error",
            reason: `Failed to create room: ${roomError.message}`
          });
          continue;
        }
        
        if (!roomData) {
          console.error(`Failed to get room ID for patient ${assignment.patient_id}`);
          results.push({
            patient_id: assignment.patient_id,
            status: "error",
            reason: "No room ID returned"
          });
          continue;
        }
        
        createdRooms.push(roomData);
        results.push({
          patient_id: assignment.patient_id,
          room_id: roomData,
          status: existingRoomsByPatient.has(assignment.patient_id) ? "updated" : "created",
          doctor_id: assignment.doctor_id,
          nutritionist_id: assignment.nutritionist_id
        });
        console.log(`Room ${roomData} ${existingRoomsByPatient.has(assignment.patient_id) ? "updated" : "created"} for patient: ${assignment.patient_id}`);
      } catch (assignmentError) {
        console.error(`Error processing assignment for patient ${assignment.patient_id}:`, assignmentError);
        results.push({
          patient_id: assignment.patient_id,
          status: "error",
          reason: assignmentError instanceof Error ? assignmentError.message : String(assignmentError)
        });
      }
    }
    
    console.log(`Successfully processed ${createdRooms.length} care team rooms`);
    
    // Count results by status
    const statusCounts = results.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("Status counts:", statusCounts);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${createdRooms.length} care team rooms`,
        rooms: createdRooms,
        results: results,
        statusCounts: statusCounts
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
