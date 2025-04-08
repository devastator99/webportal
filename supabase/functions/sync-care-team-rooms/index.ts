
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables for Supabase connection");
      throw new Error("Missing environment variables for Supabase connection");
    }

    // Create admin Supabase client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create a client with the auth context of the request
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } }
      }
    );
    
    // First, check if the user is an administrator
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
      
    if (roleError || !userRole || userRole.role !== 'administrator') {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Only administrators can sync care team rooms" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get all patient assignments
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('patient_assignments')
      .select('*');
      
    if (assignmentsError) {
      throw new Error(`Failed to fetch patient assignments: ${assignmentsError.message}`);
    }
    
    console.log(`Found ${assignments?.length || 0} patient assignments`);
    
    // Process each assignment to create/update care team rooms
    const results = [];
    const roomsProcessed = new Set();
    
    for (const assignment of assignments || []) {
      try {
        // Skip if patient_id is missing or if both doctor_id and nutritionist_id are missing
        if (!assignment.patient_id || (!assignment.doctor_id && !assignment.nutritionist_id)) {
          results.push({
            patient_id: assignment.patient_id,
            status: 'skipped',
            reason: 'Missing required IDs'
          });
          continue;
        }
        
        // Check if patient profile exists
        const { data: patientProfile, error: patientError } = await supabaseAdmin
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', assignment.patient_id)
          .single();
          
        if (patientError || !patientProfile) {
          results.push({
            patient_id: assignment.patient_id,
            status: 'skipped',
            reason: 'Patient profile not found'
          });
          continue;
        }
        
        // Call the create_care_team_room function
        const { data: roomId, error: roomError } = await supabaseAdmin.rpc(
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
            status: 'error',
            error: roomError.message
          });
          continue;
        }
        
        console.log(`Room for patient ${assignment.patient_id} synced, room ID: ${roomId}`);
        
        // Check if this is a create or update
        let status = 'created';
        if (roomsProcessed.has(roomId)) {
          status = 'updated';
        } else {
          roomsProcessed.add(roomId);
        }
        
        results.push({
          patient_id: assignment.patient_id,
          room_id: roomId,
          status,
          doctor_id: assignment.doctor_id,
          nutritionist_id: assignment.nutritionist_id
        });
      } catch (err) {
        console.error(`Error processing assignment for patient ${assignment.patient_id}:`, err);
        results.push({
          patient_id: assignment.patient_id,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
    
    // Count results by status
    const statusCounts = {
      created: results.filter(r => r.status === 'created').length,
      updated: results.filter(r => r.status === 'updated').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      error: results.filter(r => r.status === 'error').length
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        rooms: Array.from(roomsProcessed),
        results,
        statusCounts
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in sync-care-team-rooms:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
