
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
    
    console.log("Starting care team room sync edge function...");
    
    // Get all patient assignments
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('patient_assignments')
      .select('*');
      
    if (assignmentsError) {
      throw new Error(`Failed to fetch patient assignments: ${assignmentsError.message}`);
    }
    
    console.log(`Retrieved ${assignmentsData.length} patient assignments`);
    
    // Status counters
    const statusCounts = {
      created: 0,
      updated: 0,
      skipped: 0,
      error: 0
    };
    
    const results = [];
    
    // Process each assignment
    for (const assignment of assignmentsData) {
      try {
        // Skip if no patient or doctor
        if (!assignment.patient_id || !assignment.doctor_id) {
          console.log(`Skipping assignment ${assignment.id} - missing patient or doctor ID`);
          statusCounts.skipped++;
          continue;
        }
        
        console.log(`Processing assignment: patient=${assignment.patient_id}, doctor=${assignment.doctor_id}, nutritionist=${assignment.nutritionist_id || 'none'}`);
        
        // Get patient name for room name
        const { data: patientData, error: patientError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', assignment.patient_id)
          .single();
          
        if (patientError) {
          console.error(`Error fetching patient profile: ${patientError.message}`);
          statusCounts.error++;
          results.push({
            patient_id: assignment.patient_id,
            doctor_id: assignment.doctor_id,
            nutritionist_id: assignment.nutritionist_id,
            error: `Patient profile not found: ${patientError.message}`
          });
          continue;
        }
        
        const patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
        if (!patientName) {
          console.log(`Skipping patient ${assignment.patient_id} - no name found`);
          statusCounts.skipped++;
          continue;
        }
        
        const roomName = `${patientName} - Care Team`;
        
        // Check if room already exists
        const { data: existingRooms, error: roomError } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('patient_id', assignment.patient_id)
          .eq('room_type', 'care_team');
          
        if (roomError) {
          console.error(`Error checking existing rooms: ${roomError.message}`);
          statusCounts.error++;
          results.push({
            patient_id: assignment.patient_id,
            doctor_id: assignment.doctor_id,
            nutritionist_id: assignment.nutritionist_id,
            error: `Failed to check existing rooms: ${roomError.message}`
          });
          continue;
        }
        
        let roomId;
        let isNew = false;
        
        // Create or update room
        if (existingRooms && existingRooms.length > 0) {
          // Room exists, just update members
          roomId = existingRooms[0].id;
          console.log(`Using existing room ${roomId} for patient ${assignment.patient_id}`);
          statusCounts.updated++;
        } else {
          // Create new room
          const { data: newRoom, error: createError } = await supabase
            .from('chat_rooms')
            .insert([{
              name: roomName,
              description: `Care team chat for ${patientName}`,
              room_type: 'care_team',
              patient_id: assignment.patient_id
            }])
            .select('id')
            .single();
            
          if (createError) {
            console.error(`Error creating room: ${createError.message}`);
            statusCounts.error++;
            results.push({
              patient_id: assignment.patient_id,
              doctor_id: assignment.doctor_id,
              nutritionist_id: assignment.nutritionist_id,
              error: `Failed to create room: ${createError.message}`
            });
            continue;
          }
          
          roomId = newRoom.id;
          isNew = true;
          console.log(`Created new room ${roomId} for patient ${assignment.patient_id}`);
          statusCounts.created++;
        }
        
        // Ensure members are in the room
        
        // Add patient to room
        const { error: patientMemberError } = await supabase
          .from('room_members')
          .upsert([{
            room_id: roomId,
            user_id: assignment.patient_id,
            role: 'patient'
          }], { 
            onConflict: 'room_id,user_id', 
            ignoreDuplicates: true 
          });
          
        if (patientMemberError) {
          console.error(`Error adding patient to room: ${patientMemberError.message}`);
        }
        
        // Add doctor to room
        const { error: doctorMemberError } = await supabase
          .from('room_members')
          .upsert([{
            room_id: roomId,
            user_id: assignment.doctor_id,
            role: 'doctor'
          }], { 
            onConflict: 'room_id,user_id', 
            ignoreDuplicates: true 
          });
          
        if (doctorMemberError) {
          console.error(`Error adding doctor to room: ${doctorMemberError.message}`);
        }
        
        // Add nutritionist to room if assigned
        if (assignment.nutritionist_id) {
          const { error: nutritionistMemberError } = await supabase
            .from('room_members')
            .upsert([{
              room_id: roomId,
              user_id: assignment.nutritionist_id,
              role: 'nutritionist'
            }], { 
              onConflict: 'room_id,user_id', 
              ignoreDuplicates: true 
            });
            
          if (nutritionistMemberError) {
            console.error(`Error adding nutritionist to room: ${nutritionistMemberError.message}`);
          }
        }
        
        // Add AI bot to room
        const aiBotId = '00000000-0000-0000-0000-000000000000';
        const { error: aiBotMemberError } = await supabase
          .from('room_members')
          .upsert([{
            room_id: roomId,
            user_id: aiBotId,
            role: 'aibot'
          }], { 
            onConflict: 'room_id,user_id', 
            ignoreDuplicates: true 
          });
          
        if (aiBotMemberError) {
          console.error(`Error adding AI bot to room: ${aiBotMemberError.message}`);
        }
        
        // Add welcome message if it's a new room
        if (isNew) {
          const { error: welcomeMessageError } = await supabase
            .from('room_messages')
            .insert([{
              room_id: roomId,
              sender_id: assignment.doctor_id,
              message: 'Care team chat created. Team members can communicate here about patient care.',
              is_system_message: true
            }]);
            
          if (welcomeMessageError) {
            console.error(`Error adding welcome message: ${welcomeMessageError.message}`);
          }
          
          // Add AI bot welcome message
          const { error: aiBotMessageError } = await supabase
            .from('room_messages')
            .insert([{
              room_id: roomId,
              sender_id: aiBotId,
              message: 'Hello! I am your AI healthcare assistant. I am here to help facilitate communication between you and your healthcare team. How can I assist you today?',
              is_ai_message: true
            }]);
            
          if (aiBotMessageError) {
            console.error(`Error adding AI bot message: ${aiBotMessageError.message}`);
          }
        }
        
        // Verify doctor was added
        const { data: memberCheck, error: memberCheckError } = await supabase
          .from('room_members')
          .select('*')
          .eq('room_id', roomId)
          .eq('user_id', assignment.doctor_id)
          .maybeSingle();
          
        if (memberCheckError) {
          console.error(`Error verifying doctor membership: ${memberCheckError.message}`);
        } else if (!memberCheck) {
          console.error(`Doctor ${assignment.doctor_id} still not in room ${roomId} after sync`);
          
          // One more attempt to add doctor
          const { error: retryDoctorError } = await supabase
            .from('room_members')
            .insert([{
              room_id: roomId,
              user_id: assignment.doctor_id,
              role: 'doctor'
            }]);
            
          if (retryDoctorError) {
            console.error(`Retry failed to add doctor: ${retryDoctorError.message}`);
          } else {
            console.log(`Successfully added doctor ${assignment.doctor_id} to room ${roomId} on retry`);
          }
        }
        
        // Add to results
        results.push({
          patient_id: assignment.patient_id,
          doctor_id: assignment.doctor_id,
          nutritionist_id: assignment.nutritionist_id,
          room_id: roomId,
          status: isNew ? 'created' : 'updated'
        });
        
      } catch (processError) {
        console.error(`Error processing assignment: ${processError.message}`);
        statusCounts.error++;
        results.push({
          patient_id: assignment.patient_id,
          doctor_id: assignment.doctor_id,
          nutritionist_id: assignment.nutritionist_id,
          error: processError.message
        });
      }
    }
    
    console.log("Sync complete:", statusCounts);
    
    // Return response with results
    return new Response(
      JSON.stringify({
        success: true,
        results,
        statusCounts
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
    console.error("Error in sync-care-team-rooms edge function:", error);
    
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
