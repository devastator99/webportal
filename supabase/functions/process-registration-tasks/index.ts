
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
      console.error("Task fetch error:", taskError);
      throw new Error(`Failed to get next task: ${taskError.message}`);
    }
    
    // If no task is available, return success
    if (!taskData || taskData.length === 0) {
      console.log("No pending tasks found");
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
    console.log(`Processing task: ${task.task_id}, type: ${task.task_type}, for user: ${task.user_id}, retry: ${task.retry_count}`);
    
    // Process based on task type
    let processResult;
    let errorDetails = null;
    
    try {
      switch (task.task_type) {
        case 'assign_care_team':
          console.log("Starting assign_care_team task...");
          processResult = await processAssignCareTeam(supabase, task);
          console.log("assign_care_team completed:", processResult);
          break;
        case 'create_chat_room':
          console.log("Starting create_chat_room task...");
          processResult = await processCreateChatRoom(supabase, task);
          console.log("create_chat_room completed:", processResult);
          break;
        case 'send_welcome_notification':
          console.log("Starting send_welcome_notification task...");
          processResult = await processSendWelcomeNotification(supabase, task);
          console.log("send_welcome_notification completed:", processResult);
          break;
        default:
          throw new Error(`Unknown task type: ${task.task_type}`);
      }
      
      // Mark task as completed
      console.log(`Marking task ${task.task_id} as completed...`);
      const { error: updateError } = await supabase.rpc('update_registration_task_status', {
        p_task_id: task.task_id,
        p_status: 'completed',
        p_result_payload: processResult
      });
      
      if (updateError) {
        console.error("Error updating task status:", updateError);
        throw new Error(`Failed to update task status: ${updateError.message}`);
      }
      
      // Update user registration status if all tasks are completed
      console.log(`Checking if all tasks completed for user ${task.user_id}...`);
      await updateUserRegistrationStatus(supabase, task.user_id);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          task_id: task.task_id,
          task_type: task.task_type,
          result: processResult,
          message: `Task ${task.task_type} completed successfully`
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
      
    } catch (processError: any) {
      console.error(`Error processing task ${task.task_id} (${task.task_type}):`, processError);
      errorDetails = {
        message: processError.message,
        stack: processError.stack,
        task_type: task.task_type,
        retry_count: task.retry_count
      };
      
      // Mark task as failed
      console.log(`Marking task ${task.task_id} as failed...`);
      await supabase.rpc('update_registration_task_status', {
        p_task_id: task.task_id,
        p_status: 'failed',
        p_error_details: errorDetails
      });
      
      return new Response(
        JSON.stringify({ 
          success: false,
          task_id: task.task_id,
          task_type: task.task_type,
          error: processError.message,
          retry_count: task.retry_count,
          will_retry: task.retry_count < 3
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

// Function to update user registration status based on completed tasks
async function updateUserRegistrationStatus(supabase: any, userId: string) {
  try {
    console.log(`Checking pending tasks for user ${userId}...`);
    // Check if all tasks are completed for this user
    const { data: pendingTasks, error } = await supabase
      .from('registration_tasks')
      .select('id, task_type, status')
      .eq('user_id', userId)
      .eq('status', 'pending');
    
    if (error) {
      console.error('Error checking pending tasks:', error);
      return;
    }
    
    console.log(`Found ${pendingTasks?.length || 0} pending tasks for user ${userId}`);
    
    // If no pending tasks, mark registration as fully complete
    if (!pendingTasks || pendingTasks.length === 0) {
      console.log(`Marking user ${userId} as fully_registered...`);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          registration_status: 'fully_registered',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating user registration status:', updateError);
      } else {
        console.log(`User ${userId} registration marked as fully_registered`);
      }
    } else {
      console.log(`User ${userId} still has pending tasks:`, pendingTasks.map(t => t.task_type));
    }
  } catch (error) {
    console.error('Error updating user registration status:', error);
  }
}

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
    console.error("No default care team found:", careTeamError);
    throw new Error(`No active default care team found: ${careTeamError?.message || 'No data'}`);
  }

  const doctorId = careTeamData.default_doctor_id;
  const nutritionistId = careTeamData.default_nutritionist_id;
  
  console.log(`Assigning doctor ${doctorId} and nutritionist ${nutritionistId} to patient ${task.user_id}`);
  
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
    console.error("Care team assignment error:", assignmentError);
    throw new Error(`Error assigning care team: ${assignmentError.message}`);
  }
  
  console.log("Care team assigned successfully:", assignmentData);
  
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
    console.error("No care team assignment found:", assignmentError);
    throw new Error(`Patient has no care team assigned yet: ${assignmentError.message}`);
  }
  
  console.log("Found care team assignment:", assignmentData);
  
  // Get patient name for room name
  const { data: patientData, error: patientError } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', task.user_id)
    .single();
    
  if (patientError || !patientData) {
    console.error("Cannot retrieve patient profile:", patientError);
    throw new Error(`Cannot retrieve patient profile: ${patientError?.message || 'No data'}`);
  }
  
  const patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
  if (!patientName) {
    throw new Error('Patient has no name configured');
  }
  
  const roomName = `${patientName} - Care Team`;
  console.log(`Creating room: ${roomName}`);
  
  // Check if room already exists
  const { data: existingRooms, error: roomError } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('patient_id', task.user_id)
    .eq('room_type', 'care_team');
    
  if (roomError) {
    console.error("Error checking existing rooms:", roomError);
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
      console.error("Error creating room:", createError);
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
    
    console.log(`Adding ${membersToAdd.length} members to room ${roomId}`);
    
    // Add members
    const { error: membersError } = await supabase
      .from('room_members')
      .upsert(membersToAdd, { 
        onConflict: 'room_id,user_id', 
        ignoreDuplicates: true 
      });
      
    if (membersError) {
      console.error("Error adding members to room:", membersError);
      throw new Error(`Error adding members to room: ${membersError.message}`);
    }
    
    console.log("Room members added successfully");
    
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
    } else {
      console.log("Welcome message added successfully");
    }
  } catch (error: any) {
    console.error("Error configuring chat room:", error);
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
      console.error("Cannot retrieve patient profile:", patientError);
      throw new Error(`Cannot retrieve patient profile: ${patientError?.message || 'No data'}`);
    }
    
    console.log("Retrieved patient data for notifications");
    
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
    
    console.log(`Sending notifications to ${patientName} (${patientData.email})`);
    console.log(`Care team: ${doctorName}, ${nutritionistName}`);
    
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
      console.error("Notification error:", notificationError);
      // Don't fail the task if WhatsApp is missing but other channels work
      if (notificationError.message && notificationError.message.includes('TWILIO_WHATSAPP_NUMBER')) {
        console.log("WhatsApp notification failed (expected), continuing with other channels");
      } else {
        throw new Error(`Failed to send comprehensive notification: ${notificationError.message}`);
      }
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
    console.error("Welcome notification error:", error);
    // If it's just a WhatsApp configuration issue, don't fail the entire task
    if (error.message && error.message.includes('TWILIO_WHATSAPP_NUMBER')) {
      console.log("Treating WhatsApp failure as non-critical, marking task as completed");
      return {
        notification_sent: true,
        channels_used: { whatsapp: { success: false, error: 'WhatsApp not configured' } },
        timestamp: new Date().toISOString(),
        warning: 'WhatsApp notifications not available'
      };
    }
    throw new Error(`Failed to send comprehensive welcome notification: ${error.message}`);
  }
}
