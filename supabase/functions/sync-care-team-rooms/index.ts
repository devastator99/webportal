
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

    // Check if user has admin permission
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

    // Process each patient assignment to ensure care team rooms exist
    const createdRooms = [];
    
    for (const assignment of patientAssignments || []) {
      if (!assignment.patient_id || !assignment.doctor_id) {
        console.log("Skipping invalid assignment:", assignment);
        continue;
      }
      
      try {
        // Check if room already exists
        const { data: existingRoom, error: existingRoomError } = await supabaseClient
          .from('chat_rooms')
          .select('id')
          .eq('patient_id', assignment.patient_id)
          .eq('room_type', 'care_team')
          .maybeSingle();
          
        if (existingRoomError) {
          console.error("Error checking for existing room:", existingRoomError);
          continue;
        }
        
        if (existingRoom?.id) {
          console.log("Room already exists for patient:", assignment.patient_id);
          
          // Update room members to ensure all care team members are included
          await updateRoomMembers(supabaseClient, existingRoom.id, assignment);
          
          createdRooms.push(existingRoom.id);
          continue;
        }
        
        // Get patient name
        const { data: patientData, error: patientError } = await supabaseClient
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', assignment.patient_id)
          .single();
          
        if (patientError) {
          console.error("Error fetching patient:", patientError);
          continue;
        }
        
        const patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
        if (!patientName) {
          console.log("Skipping patient with no name:", assignment.patient_id);
          continue;
        }
        
        // Create room
        const { data: roomData, error: roomError } = await supabaseClient
          .from('chat_rooms')
          .insert({
            name: `${patientName} - Care Team`,
            description: `Care team chat for ${patientName}`,
            room_type: 'care_team',
            patient_id: assignment.patient_id,
            is_active: true
          })
          .select('id')
          .single();
          
        if (roomError) {
          console.error("Error creating room:", roomError);
          continue;
        }
        
        // Add room members
        await updateRoomMembers(supabaseClient, roomData.id, assignment);
        
        // Add welcome message from AI assistant
        await supabaseClient
          .from('room_messages')
          .insert({
            room_id: roomData.id,
            sender_id: '00000000-0000-0000-0000-000000000000',
            message: `Welcome to the care team chat for ${patientName}. This is a shared space for the patient, doctor, nutritionist, and AI assistant to communicate.`,
            is_system_message: true,
            is_ai_message: true
          });
        
        createdRooms.push(roomData.id);
        console.log("Created new room:", roomData.id, "for patient:", assignment.patient_id);
      } catch (assignmentError) {
        console.error("Error processing assignment:", assignmentError);
      }
    }
    
    console.log(`Successfully processed ${createdRooms.length} care team rooms`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${createdRooms.length} care team rooms`,
        rooms: createdRooms 
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

// Helper function to ensure all care team members are in the room
async function updateRoomMembers(supabase, roomId, assignment) {
  try {
    // Add patient
    await supabase
      .from('room_members')
      .upsert({
        room_id: roomId,
        user_id: assignment.patient_id,
        role: 'patient'
      }, { onConflict: 'room_id,user_id' });
    
    // Add doctor
    if (assignment.doctor_id) {
      await supabase
        .from('room_members')
        .upsert({
          room_id: roomId,
          user_id: assignment.doctor_id,
          role: 'doctor'
        }, { onConflict: 'room_id,user_id' });
    }
    
    // Add nutritionist if assigned
    if (assignment.nutritionist_id) {
      await supabase
        .from('room_members')
        .upsert({
          room_id: roomId,
          user_id: assignment.nutritionist_id,
          role: 'nutritionist'
        }, { onConflict: 'room_id,user_id' });
    }
    
    // Add AI bot
    await supabase
      .from('room_members')
      .upsert({
        room_id: roomId,
        user_id: '00000000-0000-0000-0000-000000000000',
        role: 'aibot'
      }, { onConflict: 'room_id,user_id' });
    
    console.log("Updated members for room:", roomId);
    return true;
  } catch (error) {
    console.error("Error updating room members:", error);
    return false;
  }
}
