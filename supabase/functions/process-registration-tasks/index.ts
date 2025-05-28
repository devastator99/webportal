
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Task {
  task_id: string;
  user_id: string;
  task_type: string;
  retry_count: number;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
    
    console.log("Starting registration task processor...");
    
    // Get the next pending task
    const { data: taskData, error: taskError } = await supabase.rpc(
      'get_next_pending_registration_task'
    );
    
    if (taskError) {
      throw new Error(`Failed to get next task: ${taskError.message}`);
    }
    
    // If no task is available, return success
    if (!taskData || taskData.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "No pending tasks found"
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    // Get task info (first row)
    const task: Task = taskData[0];
    console.log(`Processing task: ${task.task_id}, type: ${task.task_type}, for user: ${task.user_id}`);
    
    // Process based on task type
    let processResult;
    let errorDetails = null;
    
    try {
      switch (task.task_type) {
        case 'assign_care_team':
          processResult = await processAssignCareTeam(supabase, task);
          break;
        case 'create_chat_room':
          processResult = await processCreateChatRoom(supabase, task);
          break;
        case 'send_welcome_notification':
          processResult = await processSendWelcomeNotification(supabase, task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.task_type}`);
      }
      
      // Mark task as completed
      await supabase.rpc('update_registration_task_status', {
        p_task_id: task.task_id,
        p_status: 'completed',
        p_result_payload: processResult
      });
      
      return new Response(
        JSON.stringify({ 
          success: true,
          task_id: task.task_id,
          task_type: task.task_type,
          result: processResult
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
      
    } catch (processError: any) {
      console.error(`Error processing task ${task.task_id}:`, processError);
      errorDetails = {
        message: processError.message,
        stack: processError.stack
      };
      
      // Mark task as failed
      await supabase.rpc('update_registration_task_status', {
        p_task_id: task.task_id,
        p_status: 'failed',
        p_error_details: errorDetails
      });
      
      return new Response(
        JSON.stringify({ 
          success: false,
          task_id: task.task_id,
          error: processError.message
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
  } catch (error: any) {
    console.error("Error in process-registration-tasks:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

// Function to process assign care team task
async function processAssignCareTeam(supabase: any, task: Task) {
  console.log(`Processing assign care team task for user ${task.user_id}`);
  
  // Get default care team
  const { data: careTeamData, error: careTeamError } = await supabase
    .from('default_care_teams')
    .select('default_doctor_id, default_nutritionist_id')
    .eq('is_active', true)
    .single();
    
  if (careTeamError || !careTeamData) {
    throw new Error(`No active default care team found: ${careTeamError?.message || 'No data'}`);
  }

  const doctorId = careTeamData.default_doctor_id;
  const nutritionistId = careTeamData.default_nutritionist_id;
  
  if (!doctorId) {
    throw new Error('Default doctor not configured');
  }
  
  // Assign care team (upsert)
  const { data: assignmentData, error: assignmentError } = await supabase
    .from('patient_assignments')
    .upsert({
      patient_id: task.user_id,
      doctor_id: doctorId,
      nutritionist_id: nutritionistId,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'patient_id'
    })
    .select();
    
  if (assignmentError) {
    throw new Error(`Error assigning care team: ${assignmentError.message}`);
  }
  
  return {
    assignment_id: assignmentData?.[0]?.id,
    doctor_id: doctorId,
    nutritionist_id: nutritionistId
  };
}

// Function to process create chat room task
async function processCreateChatRoom(supabase: any, task: Task) {
  console.log(`Processing create chat room task for user ${task.user_id}`);
  
  // First check if patient has assignments
  const { data: assignmentData, error: assignmentError } = await supabase
    .from('patient_assignments')
    .select('doctor_id, nutritionist_id')
    .eq('patient_id', task.user_id)
    .single();
    
  if (assignmentError) {
    throw new Error(`Patient has no care team assigned yet: ${assignmentError.message}`);
  }
  
  // Get patient name for room name
  const { data: patientData, error: patientError } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', task.user_id)
    .single();
    
  if (patientError || !patientData) {
    throw new Error(`Cannot retrieve patient profile: ${patientError?.message || 'No data'}`);
  }
  
  const patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
  if (!patientName) {
    throw new Error('Patient has no name configured');
  }
  
  const roomName = `${patientName} - Care Team`;
  
  // Check if room already exists
  const { data: existingRooms, error: roomError } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('patient_id', task.user_id)
    .eq('room_type', 'care_team');
    
  if (roomError) {
    throw new Error(`Error checking existing rooms: ${roomError.message}`);
  }
  
  let roomId;
  
  // Create or update room
  if (existingRooms && existingRooms.length > 0) {
    // Room exists
    roomId = existingRooms[0].id;
    console.log(`Using existing room ${roomId} for patient ${task.user_id}`);
  } else {
    // Create new room
    const { data: newRoom, error: createError } = await supabase
      .from('chat_rooms')
      .insert([{
        name: roomName,
        description: `Care team chat for ${patientName}`,
        room_type: 'care_team',
        patient_id: task.user_id
      }])
      .select('id')
      .single();
      
    if (createError) {
      throw new Error(`Error creating room: ${createError.message}`);
    }
    
    roomId = newRoom.id;
    console.log(`Created new room ${roomId} for patient ${task.user_id}`);
  }
  
  // Add members to room
  try {
    const membersToAdd = [
      {
        room_id: roomId,
        user_id: task.user_id,
        role: 'patient'
      },
      {
        room_id: roomId,
        user_id: assignmentData.doctor_id,
        role: 'doctor'
      }
    ];
    
    if (assignmentData.nutritionist_id) {
      membersToAdd.push({
        room_id: roomId,
        user_id: assignmentData.nutritionist_id,
        role: 'nutritionist'
      });
    }
    
    // Add AI bot to room
    membersToAdd.push({
      room_id: roomId,
      user_id: '00000000-0000-0000-0000-000000000000',
      role: 'aibot'
    });
    
    // Add members
    const { error: membersError } = await supabase
      .from('room_members')
      .upsert(membersToAdd, { 
        onConflict: 'room_id,user_id', 
        ignoreDuplicates: true 
      });
      
    if (membersError) {
      throw new Error(`Error adding members to room: ${membersError.message}`);
    }
    
    // Add welcome message
    const { error: welcomeMessageError } = await supabase
      .from('room_messages')
      .insert([{
        room_id: roomId,
        sender_id: assignmentData.doctor_id,
        message: 'Care team chat created. Team members can communicate here about patient care.',
        is_system_message: true
      }]);
      
    if (welcomeMessageError) {
      console.error(`Error adding welcome message: ${welcomeMessageError.message}`);
      // Don't throw, continue with success
    }
  } catch (error: any) {
    throw new Error(`Error configuring chat room: ${error.message}`);
  }
  
  return {
    room_id: roomId,
    room_name: roomName
  };
}

// Enhanced function to process send welcome notification task
async function processSendWelcomeNotification(supabase: any, task: Task) {
  console.log(`Processing comprehensive welcome notification for user ${task.user_id}`);
  
  try {
    // Get patient and care team information
    const { data: patientData, error: patientError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, phone')
      .eq('id', task.user_id)
      .single();
    
    if (patientError || !patientData) {
      throw new Error(`Cannot retrieve patient profile: ${patientError?.message || 'No data'}`);
    }
    
    // Get care team assignment
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('patient_assignments')
      .select(`
        doctor:profiles!patient_assignments_doctor_id_fkey(first_name, last_name),
        nutritionist:profiles!patient_assignments_nutritionist_id_fkey(first_name, last_name)
      `)
      .eq('patient_id', task.user_id)
      .single();
    
    let doctorName = 'Being assigned';
    let nutritionistName = 'Being assigned';
    
    if (assignmentData) {
      if (assignmentData.doctor) {
        doctorName = `Dr. ${assignmentData.doctor.first_name} ${assignmentData.doctor.last_name}`.trim();
      }
      if (assignmentData.nutritionist) {
        nutritionistName = `${assignmentData.nutritionist.first_name} ${assignmentData.nutritionist.last_name}`.trim();
      }
    }
    
    const patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
    
    // Call the comprehensive notification function
    const { data: notificationResult, error: notificationError } = await supabase.functions.invoke(
      'send-comprehensive-welcome-notification',
      {
        body: {
          patient_id: task.user_id,
          patient_name: patientName,
          patient_email: patientData.email,
          patient_phone: patientData.phone,
          doctor_name: doctorName,
          nutritionist_name: nutritionistName
        }
      }
    );
    
    if (notificationError) {
      throw new Error(`Failed to send comprehensive notification: ${notificationError.message}`);
    }
    
    console.log("Comprehensive welcome notification sent:", notificationResult);
    
    return {
      notification_sent: true,
      channels_used: notificationResult?.results || {},
      timestamp: new Date().toISOString(),
      patient_name: patientName,
      doctor_name: doctorName,
      nutritionist_name: nutritionistName
    };
    
  } catch (error: any) {
    throw new Error(`Failed to send comprehensive welcome notification: ${error.message}`);
  }
}
