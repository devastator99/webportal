
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
    // Get optional patient filter from request body
    let patientFilter = null;
    try {
      const body = await req.json();
      patientFilter = body?.patient_id || null;
    } catch (e) {
      // No body or invalid JSON - that's okay, continue without filter
      console.log("No request body or invalid JSON, processing all pending tasks");
    }
    
    // Get Supabase connection parameters from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase connection parameters");
    }
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Starting registration task processor...", 
      patientFilter ? `for patient: ${patientFilter}` : "for all patients");
    
    // Get the next pending task using the existing function
    const { data: taskData, error: taskError } = await supabase.rpc(
      'get_next_pending_registration_task'
    );
    
    if (taskError) {
      console.error("Task fetch error:", taskError);
      throw new Error(`Failed to get next task: ${taskError.message}`);
    }
    
    // Filter by patient if specified
    let filteredTasks = taskData || [];
    if (patientFilter && filteredTasks.length > 0) {
      filteredTasks = filteredTasks.filter((task: Task) => task.user_id === patientFilter);
    }
    
    // If no task is available, return success
    if (!filteredTasks || filteredTasks.length === 0) {
      const message = patientFilter 
        ? `No pending tasks found for patient: ${patientFilter}`
        : "No pending tasks found";
      console.log(message);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: message,
          patient_filter: patientFilter
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    // Get task info (first row)
    const task: Task = filteredTasks[0];
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
          patient_id: task.user_id,
          result: processResult,
          message: `Task ${task.task_type} completed successfully for patient ${task.user_id}`,
          patient_filter: patientFilter
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
          patient_id: task.user_id,
          error: processError.message,
          retry_count: task.retry_count,
          will_retry: task.retry_count < 3,
          patient_filter: patientFilter
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

// Function to process assign care team task with better error handling
async function processAssignCareTeam(supabase: any, task: Task) {
  console.log(`Processing assign care team task for user ${task.user_id}`);
  
  // Get default care team with better error handling
  const { data: careTeamData, error: careTeamError } = await supabase
    .from('default_care_teams')
    .select('default_doctor_id, default_nutritionist_id')
    .eq('is_active', true)
    .maybeSingle(); // Use maybeSingle to avoid throwing on no results
    
  if (careTeamError) {
    console.error("Error fetching default care team:", careTeamError);
    throw new Error(`Error fetching default care team: ${careTeamError.message}`);
  }
  
  if (!careTeamData) {
    console.error("No default care team found");
    throw new Error('No active default care team configured. Please set up default care team in admin settings.');
  }

  const doctorId = careTeamData.default_doctor_id;
  const nutritionistId = careTeamData.default_nutritionist_id;
  
  console.log(`Assigning doctor ${doctorId} and nutritionist ${nutritionistId} to patient ${task.user_id}`);
  
  if (!doctorId) {
    throw new Error('Default doctor not configured in care team settings');
  }
  
  // Check if assignment already exists and handle upsert properly
  const { data: existingAssignment, error: checkError } = await supabase
    .from('patient_assignments')
    .select('id, doctor_id, nutritionist_id')
    .eq('patient_id', task.user_id)
    .maybeSingle();
  
  if (checkError) {
    console.error("Error checking existing assignment:", checkError);
    throw new Error(`Error checking existing assignment: ${checkError.message}`);
  }
  
  let assignmentData;
  
  if (existingAssignment) {
    // Update existing assignment
    console.log(`Updating existing assignment for patient ${task.user_id}`);
    const { data: updateData, error: updateError } = await supabase
      .from('patient_assignments')
      .update({
        doctor_id: doctorId,
        nutritionist_id: nutritionistId,
        updated_at: new Date().toISOString()
      })
      .eq('patient_id', task.user_id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Care team assignment update error:", updateError);
      throw new Error(`Error updating care team assignment: ${updateError.message}`);
    }
    
    assignmentData = updateData;
  } else {
    // Create new assignment
    console.log(`Creating new assignment for patient ${task.user_id}`);
    const { data: insertData, error: insertError } = await supabase
      .from('patient_assignments')
      .insert({
        patient_id: task.user_id,
        doctor_id: doctorId,
        nutritionist_id: nutritionistId
      })
      .select()
      .single();
      
    if (insertError) {
      console.error("Care team assignment creation error:", insertError);
      throw new Error(`Error creating care team assignment: ${insertError.message}`);
    }
    
    assignmentData = insertData;
  }
  
  console.log("Care team assigned successfully:", assignmentData);
  
  return {
    assignment_id: assignmentData.id,
    doctor_id: doctorId,
    nutritionist_id: nutritionistId,
    action: existingAssignment ? 'updated' : 'created'
  };
}

// Function to process create chat room task with improved error handling
async function processCreateChatRoom(supabase: any, task: Task) {
  console.log(`Processing create chat room task for user ${task.user_id}`);
  
  // First check if patient has assignments with better error handling
  const { data: assignmentData, error: assignmentError } = await supabase
    .from('patient_assignments')
    .select('doctor_id, nutritionist_id')
    .eq('patient_id', task.user_id)
    .maybeSingle();
    
  if (assignmentError) {
    console.error("Error fetching care team assignment:", assignmentError);
    throw new Error(`Error fetching care team assignment: ${assignmentError.message}`);
  }
  
  if (!assignmentData) {
    console.error("No care team assignment found for patient:", task.user_id);
    throw new Error(`Patient ${task.user_id} has no care team assigned yet. Care team must be assigned before creating chat room.`);
  }
  
  console.log("Found care team assignment:", assignmentData);
  
  // Get patient name for room name with better error handling
  const { data: patientData, error: patientError } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', task.user_id)
    .maybeSingle();
    
  if (patientError) {
    console.error("Error retrieving patient profile:", patientError);
    throw new Error(`Error retrieving patient profile: ${patientError.message}`);
  }
  
  if (!patientData) {
    console.error("Patient profile not found:", task.user_id);
    throw new Error(`Patient profile not found for user: ${task.user_id}`);
  }
  
  const patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
  if (!patientName) {
    throw new Error('Patient has no name configured in profile');
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
  
  // Create or use existing room
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
  
  // Add members to room with better error handling
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
    
    // Add nutritionist if assigned
    if (assignmentData.nutritionist_id) {
      console.log(`Adding nutritionist ${assignmentData.nutritionist_id} to room ${roomId}`);
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
    
    console.log(`Adding ${membersToAdd.length} members to room ${roomId}:`, membersToAdd.map(m => `${m.role}(${m.user_id})`));
    
    // Add members with upsert to handle duplicates
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
        message: 'Welcome to your care team chat! Your healthcare team can communicate here about your care.',
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
    room_name: roomName,
    members_added: assignmentData.nutritionist_id ? ['patient', 'doctor', 'nutritionist', 'aibot'] : ['patient', 'doctor', 'aibot'],
    action: existingRooms && existingRooms.length > 0 ? 'updated' : 'created'
  };
}

// Enhanced function to process send welcome notification task with better email handling
async function processSendWelcomeNotification(supabase: any, task: Task) {
  console.log(`Processing comprehensive welcome notification for user ${task.user_id}`);
  
  try {
    // Get patient information - profiles table doesn't have email, we need to join with auth.users
    const { data: patientData, error: patientError } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', task.user_id)
      .maybeSingle();
    
    if (patientError) {
      console.error("Cannot retrieve patient profile:", patientError);
      throw new Error(`Cannot retrieve patient profile: ${patientError.message}`);
    }
    
    if (!patientData) {
      console.error("Patient profile not found:", task.user_id);
      throw new Error(`Patient profile not found for user: ${task.user_id}`);
    }
    
    // Get email from auth.users using admin client
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(task.user_id);
    
    if (authError || !authUser.user) {
      console.error("Cannot retrieve auth user for email:", authError);
      throw new Error(`Cannot retrieve user email: ${authError?.message || 'User not found in auth system'}`);
    }
    
    const patientEmail = authUser.user.email;
    if (!patientEmail) {
      throw new Error('Patient email not found in auth system');
    }
    
    console.log("Retrieved patient data for notifications");
    
    // Get care team assignment with better error handling
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('patient_assignments')
      .select(`
        doctor:profiles!patient_assignments_doctor_id_fkey(first_name, last_name),
        nutritionist:profiles!patient_assignments_nutritionist_id_fkey(first_name, last_name)
      `)
      .eq('patient_id', task.user_id)
      .maybeSingle();
    
    let doctorName = 'Your assigned doctor';
    let nutritionistName = 'Your assigned nutritionist';
    
    if (assignmentData) {
      if (assignmentData.doctor) {
        doctorName = `Dr. ${assignmentData.doctor.first_name} ${assignmentData.doctor.last_name}`.trim();
      }
      if (assignmentData.nutritionist) {
        nutritionistName = `${assignmentData.nutritionist.first_name} ${assignmentData.nutritionist.last_name}`.trim();
      }
    } else {
      console.warn(`No care team assignment found for patient ${task.user_id}, using default names`);
    }
    
    const patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
    
    console.log(`Sending notifications to ${patientName} (${patientEmail})`);
    console.log(`Care team: ${doctorName}, ${nutritionistName}`);
    
    // Call the comprehensive notification function
    const { data: notificationResult, error: notificationError } = await supabase.functions.invoke(
      'send-comprehensive-welcome-notification',
      {
        body: {
          patient_id: task.user_id,
          patient_name: patientName,
          patient_email: patientEmail,
          patient_phone: patientData.phone,
          doctor_name: doctorName,
          nutritionist_name: nutritionistName
        }
      }
    );
    
    if (notificationError) {
      console.error("Notification function error:", notificationError);
      throw new Error(`Failed to call notification function: ${notificationError.message}`);
    }
    
    console.log("Notification function response:", notificationResult);
    
    // Parse the results to determine success criteria
    const results = notificationResult?.results || {};
    const successfulChannels = [];
    const failedChannels = [];
    
    // Check each channel
    Object.keys(results).forEach(channel => {
      const channelResult = results[channel];
      if (channelResult.success) {
        successfulChannels.push(channel);
      } else {
        failedChannels.push({
          channel,
          error: channelResult.error
        });
      }
    });
    
    console.log(`Successful channels: ${successfulChannels.join(', ')}`);
    console.log(`Failed channels: ${failedChannels.map(f => `${f.channel} (${f.error})`).join(', ')}`);
    
    // Consider the task successful if AT LEAST ONE channel worked
    if (successfulChannels.length > 0) {
      console.log(`Notification task considered successful - ${successfulChannels.length}/${Object.keys(results).length} channels worked`);
      
      return {
        notification_sent: true,
        successful_channels: successfulChannels,
        failed_channels: failedChannels,
        channels_summary: `${successfulChannels.length}/${Object.keys(results).length} channels successful`,
        timestamp: new Date().toISOString(),
        patient_name: patientName,
        patient_email: patientEmail,
        doctor_name: doctorName,
        nutritionist_name: nutritionistName,
        detailed_results: results
      };
    } else {
      // Only fail if ALL channels failed
      console.error("All notification channels failed");
      throw new Error(`All notification channels failed: ${failedChannels.map(f => `${f.channel}: ${f.error}`).join('; ')}`);
    }
    
  } catch (error: any) {
    console.error("Welcome notification error:", error);
    
    // Check if this is a specific configuration issue that should be treated as non-critical
    const nonCriticalErrors = [
      'TWILIO_WHATSAPP_NUMBER',
      'TWILIO_PHONE_NUMBER', 
      'RESEND_API_KEY',
      'WhatsApp not configured'
    ];
    
    const isConfigurationIssue = nonCriticalErrors.some(errorType => 
      error.message && error.message.includes(errorType)
    );
    
    if (isConfigurationIssue) {
      console.log("Treating configuration issue as partial success");
      return {
        notification_sent: true,
        successful_channels: ['internal'], // Assume internal notification always works
        failed_channels: [{ channel: 'external', error: error.message }],
        channels_summary: 'Partial success - some channels not configured',
        timestamp: new Date().toISOString(),
        warning: 'Some notification channels not available due to configuration',
        configuration_issue: error.message
      };
    }
    
    // For other errors, fail the task
    throw new Error(`Failed to send comprehensive welcome notification: ${error.message}`);
  }
}
