
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// AI Bot ID constant
const AI_BOT_ID = '00000000-0000-0000-0000-000000000000';

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

    // Check if user has admin permission
    const { data: canSyncRooms, error: permissionError } = await supabaseClient.rpc('user_can_sync_rooms');
    
    if (permissionError) {
      console.error("Error checking permission:", permissionError);
      return new Response(
        JSON.stringify({ error: `Permission check failed: ${permissionError.message}` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!canSyncRooms) {
      return new Response(
        JSON.stringify({ error: "Only administrators can sync care team rooms" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the patient_assignments_report RPC to get assignments
    console.log("Fetching patient assignments report...");
    const { data: patientAssignmentsReport, error: parError } = await supabaseClient
      .rpc('get_patient_assignments_report');
      
    if (parError) {
      console.error("Error fetching patient assignments report:", parError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch patient assignments: ${parError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!patientAssignmentsReport || patientAssignmentsReport.length === 0) {
      console.log("No patient assignments found");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No patient assignments found to sync", 
          rooms: [] 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Found ${patientAssignmentsReport.length} patient assignments to process`);

    // Process each patient assignment to create care team rooms
    const createdRooms = [];
    const results = [];
    
    for (const assignment of patientAssignmentsReport) {
      try {
        // Skip if no doctor assigned (required for care team)
        if (!assignment.doctor_id) {
          console.log(`Skipping patient ${assignment.patient_id}: No doctor assigned`);
          results.push({
            patient_id: assignment.patient_id,
            patient_name: `${assignment.patient_first_name || ''} ${assignment.patient_last_name || ''}`.trim(),
            status: "skipped",
            reason: "No doctor assigned"
          });
          continue;
        }

        // Check if patient has a name
        const patientName = `${assignment.patient_first_name || ''} ${assignment.patient_last_name || ''}`.trim();
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
        const { data: roomId, error: roomError } = await supabaseClient.rpc(
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
            patient_name: patientName,
            status: "error",
            reason: roomError.message
          });
          continue;
        }
        
        if (!roomId) {
          console.error(`Failed to get room ID for patient ${assignment.patient_id}`);
          results.push({
            patient_id: assignment.patient_id,
            patient_name: patientName,
            status: "error",
            reason: "No room ID returned"
          });
          continue;
        }
        
        createdRooms.push(roomId);
        
        // Check if this is a new room by querying room_members
        const { count, error: membersError } = await supabaseClient
          .from('room_members')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', roomId);
          
        const isNewRoom = count === 0 || count === null;
        
        results.push({
          patient_id: assignment.patient_id,
          patient_name: patientName,
          room_id: roomId,
          status: isNewRoom ? "created" : "updated",
          doctor_id: assignment.doctor_id,
          doctor_name: `${assignment.doctor_first_name || ''} ${assignment.doctor_last_name || ''}`.trim(),
          nutritionist_id: assignment.nutritionist_id,
          nutritionist_name: assignment.nutritionist_id ? 
            `${assignment.nutritionist_first_name || ''} ${assignment.nutritionist_last_name || ''}`.trim() : 
            null
        });
        console.log(`Room ${roomId} ${isNewRoom ? "created" : "updated"} for patient: ${patientName}`);
      } catch (assignmentError) {
        console.error(`Error processing assignment:`, assignmentError);
        results.push({
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
