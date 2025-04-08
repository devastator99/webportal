
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
    // Get Supabase connection parameters from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase connection parameters");
    }
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Running fix for care team rooms with missing doctors...");
    
    // Direct database approach: Get all doctors
    const { data: doctors, error: doctorsError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'doctor');
      
    if (doctorsError) {
      throw new Error(`Failed to fetch doctors: ${doctorsError.message}`);
    }
    
    console.log(`Found ${doctors?.length || 0} doctors`);
    
    const fixResults = [];
    
    // Process each doctor
    for (const doctor of doctors || []) {
      const doctorId = doctor.user_id;
      console.log(`Processing doctor: ${doctorId}`);
      
      // Get all patients assigned to this doctor
      const { data: assignments, error: assignmentsError } = await supabase
        .from('patient_assignments')
        .select('patient_id')
        .eq('doctor_id', doctorId);
        
      if (assignmentsError) {
        console.error(`Error fetching assignments for doctor ${doctorId}:`, assignmentsError);
        fixResults.push({
          doctor_id: doctorId,
          action: `Error fetching assignments: ${assignmentsError.message}`,
          status: 'error'
        });
        continue;
      }
      
      // Skip if no patients assigned
      if (!assignments || assignments.length === 0) {
        fixResults.push({
          doctor_id: doctorId,
          action: 'No patients assigned to this doctor',
          status: 'skipped'
        });
        continue;
      }
      
      console.log(`Doctor ${doctorId} has ${assignments.length} assigned patients`);
      
      // Get all care team rooms for these patients
      const patientIds = assignments.map(a => a.patient_id);
      
      const { data: rooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('id, name, patient_id')
        .in('patient_id', patientIds)
        .eq('room_type', 'care_team')
        .eq('is_active', true);
        
      if (roomsError) {
        console.error(`Error fetching rooms for doctor ${doctorId}:`, roomsError);
        fixResults.push({
          doctor_id: doctorId,
          action: `Error fetching care team rooms: ${roomsError.message}`,
          status: 'error'
        });
        continue;
      }
      
      // Skip if no care team rooms found
      if (!rooms || rooms.length === 0) {
        fixResults.push({
          doctor_id: doctorId,
          action: 'No care team rooms found for assigned patients',
          status: 'info'
        });
        continue;
      }
      
      console.log(`Found ${rooms.length} care team rooms for doctor ${doctorId}'s patients`);
      
      let roomsFixed = 0;
      let roomsAlreadyMember = 0;
      let roomFixErrors = 0;
      
      // For each room, check if doctor is a member
      for (const room of rooms) {
        // Check if doctor is already a member
        const { data: membership, error: membershipError } = await supabase
          .from('room_members')
          .select('id')
          .eq('room_id', room.id)
          .eq('user_id', doctorId)
          .maybeSingle();
          
        if (membershipError) {
          console.error(`Error checking membership for doctor ${doctorId} in room ${room.id}:`, membershipError);
          fixResults.push({
            doctor_id: doctorId,
            room_id: room.id,
            action: `Error checking membership: ${membershipError.message}`,
            status: 'error'
          });
          roomFixErrors++;
          continue;
        }
        
        // If doctor is already a member, skip
        if (membership) {
          roomsAlreadyMember++;
          continue;
        }
        
        // Add doctor to the room
        const { error: insertError } = await supabase
          .from('room_members')
          .insert({
            room_id: room.id,
            user_id: doctorId,
            role: 'doctor'
          });
          
        if (insertError) {
          console.error(`Error adding doctor ${doctorId} to room ${room.id}:`, insertError);
          fixResults.push({
            doctor_id: doctorId,
            room_id: room.id,
            action: `Error adding to room: ${insertError.message}`,
            status: 'error'
          });
          roomFixErrors++;
        } else {
          console.log(`Added doctor ${doctorId} to room ${room.id}`);
          fixResults.push({
            doctor_id: doctorId,
            room_id: room.id,
            action: 'Added to room',
            status: 'fixed'
          });
          roomsFixed++;
        }
      }
      
      // Add summary for this doctor
      fixResults.push({
        doctor_id: doctorId,
        action: `Processed ${rooms.length} rooms: Added to ${roomsFixed} rooms, already member of ${roomsAlreadyMember} rooms, errors with ${roomFixErrors} rooms`,
        status: 'summary'
      });
    }
    
    // Return detailed information
    return new Response(
      JSON.stringify({
        success: true,
        totalDoctors: doctors?.length || 0,
        totalFixes: fixResults.filter(r => r.status === 'fixed').length,
        details: fixResults
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("Error in fix-doctor-room-access edge function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
