
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
    
    // Run the fix_care_team_rooms_missing_doctors function
    const { data: fixResults, error: fixError } = await supabase
      .rpc('fix_care_team_rooms_missing_doctors');
      
    if (fixError) {
      throw new Error(`Failed to run fix: ${fixError.message}`);
    }
    
    console.log("Fix results:", fixResults);
    
    // Count the fixes
    const totalFixes = fixResults ? fixResults.length : 0;
    const successfulFixes = fixResults ? fixResults.filter(r => !r.action.includes('Error')).length : 0;
    const errorFixes = totalFixes - successfulFixes;
    
    // Let's add a diagnostic check to verify doctor membership after fixes
    console.log("Verifying doctor room memberships after fix...");
    
    // Get all doctor users
    const { data: doctors, error: doctorsError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'doctor');
      
    if (doctorsError) {
      console.error("Error fetching doctors:", doctorsError);
    }
    
    const doctorDiagnostics = [];
    
    // For each doctor, check their room memberships
    if (doctors && doctors.length > 0) {
      for (const doctor of doctors) {
        const doctorId = doctor.user_id;
        
        // Get patient assignments for this doctor
        const { data: assignments, error: assignmentsError } = await supabase
          .from('patient_assignments')
          .select('patient_id')
          .eq('doctor_id', doctorId);
          
        if (assignmentsError) {
          console.error(`Error fetching assignments for doctor ${doctorId}:`, assignmentsError);
          continue;
        }
        
        // Get rooms this doctor should be a member of
        const patientIds = assignments?.map(a => a.patient_id) || [];
        
        if (patientIds.length === 0) {
          doctorDiagnostics.push({
            doctor_id: doctorId,
            status: "No patients assigned",
            rooms: []
          });
          continue;
        }
        
        // Get care team rooms for these patients
        const { data: rooms, error: roomsError } = await supabase
          .from('chat_rooms')
          .select('id, name, patient_id')
          .in('patient_id', patientIds)
          .eq('room_type', 'care_team');
          
        if (roomsError) {
          console.error(`Error fetching rooms for doctor ${doctorId}:`, roomsError);
          continue;
        }
        
        const roomDiagnostics = [];
        
        // Check if doctor is a member of each room
        for (const room of rooms || []) {
          const { data: membership, error: membershipError } = await supabase
            .from('room_members')
            .select('id')
            .eq('room_id', room.id)
            .eq('user_id', doctorId)
            .maybeSingle();
            
          if (membershipError) {
            console.error(`Error checking membership for doctor ${doctorId} in room ${room.id}:`, membershipError);
            continue;
          }
          
          const isMember = !!membership;
          
          // If not a member, add them
          if (!isMember) {
            const { error: insertError } = await supabase
              .from('room_members')
              .insert({
                room_id: room.id,
                user_id: doctorId,
                role: 'doctor'
              });
              
            if (insertError) {
              console.error(`Error adding doctor ${doctorId} to room ${room.id}:`, insertError);
              roomDiagnostics.push({
                room_id: room.id,
                room_name: room.name,
                is_member: false,
                fix_attempted: true,
                fix_successful: false,
                error: insertError.message
              });
            } else {
              console.log(`Added doctor ${doctorId} to room ${room.id}`);
              roomDiagnostics.push({
                room_id: room.id,
                room_name: room.name,
                is_member: true, // Now a member after fix
                fix_attempted: true,
                fix_successful: true
              });
            }
          } else {
            roomDiagnostics.push({
              room_id: room.id,
              room_name: room.name,
              is_member: true,
              fix_attempted: false
            });
          }
        }
        
        doctorDiagnostics.push({
          doctor_id: doctorId,
          assigned_patients: patientIds.length,
          care_team_rooms: rooms?.length || 0,
          rooms: roomDiagnostics
        });
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        totalFixes,
        successfulFixes,
        errorFixes,
        details: fixResults,
        doctor_diagnostics: doctorDiagnostics
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
