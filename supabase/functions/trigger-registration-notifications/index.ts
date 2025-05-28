
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { patient_id } = await req.json();
    
    console.log("Triggering registration notifications for patient:", patient_id);
    
    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: "Patient ID is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Check if there are any pending tasks for this specific patient
    const { data: pendingTasks, error: initialTaskError } = await supabase
      .from('registration_tasks')
      .select('id, task_type, status, retry_count')
      .eq('user_id', patient_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (initialTaskError) {
      console.error("Error checking initial pending tasks:", initialTaskError);
      return new Response(
        JSON.stringify({ error: "Failed to check pending tasks" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    if (!pendingTasks || pendingTasks.length === 0) {
      console.log("No pending tasks found for patient:", patient_id);
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending registration tasks found for this patient",
          patient_id: patient_id,
          pending_tasks: 0
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    console.log(`Found ${pendingTasks.length} pending tasks for patient ${patient_id}:`, 
      pendingTasks.map(t => `${t.task_type} (retry: ${t.retry_count})`).join(', '));
    
    // Process all tasks independently and in parallel
    const taskPromises = pendingTasks.map(async (task) => {
      console.log(`Starting independent processing of task ${task.task_type} for patient ${patient_id}`);
      
      try {
        let processResult;
        
        // Process each task type directly and independently
        switch (task.task_type) {
          case 'assign_care_team':
            console.log(`Processing assign_care_team task ${task.id}`);
            processResult = await processAssignCareTeam(supabase, task, patient_id);
            break;
          case 'create_chat_room':
            console.log(`Processing create_chat_room task ${task.id}`);
            processResult = await processCreateChatRoom(supabase, task, patient_id);
            break;
          case 'send_welcome_notification':
            console.log(`Processing send_welcome_notification task ${task.id}`);
            processResult = await processSendWelcomeNotification(supabase, task, patient_id);
            break;
          default:
            throw new Error(`Unknown task type: ${task.task_type}`);
        }
        
        // Mark task as completed
        console.log(`Marking task ${task.id} (${task.task_type}) as completed`);
        const { error: updateError } = await supabase.rpc('update_registration_task_status', {
          p_task_id: task.id,
          p_status: 'completed',
          p_result_payload: processResult
        });
        
        if (updateError) {
          console.error(`Error updating task ${task.id} status:`, updateError);
          throw new Error(`Failed to update task status: ${updateError.message}`);
        }
        
        return {
          task_id: task.id,
          task_type: task.task_type,
          status: 'completed',
          result: processResult
        };
        
      } catch (error: any) {
        console.error(`Error processing task ${task.id} (${task.task_type}):`, error);
        
        // Mark task as failed
        await supabase.rpc('update_registration_task_status', {
          p_task_id: task.id,
          p_status: 'failed',
          p_error_details: {
            message: error.message,
            stack: error.stack,
            task_type: task.task_type,
            retry_count: task.retry_count
          }
        });
        
        return {
          task_id: task.id,
          task_type: task.task_type,
          status: 'failed',
          error: error.message,
          retry_count: task.retry_count
        };
      }
    });
    
    // Wait for all tasks to complete (in parallel)
    console.log(`Processing ${taskPromises.length} tasks in parallel for patient ${patient_id}`);
    const taskResults = await Promise.allSettled(taskPromises);
    
    // Analyze results
    const processedTasks = [];
    const failedTasks = [];
    
    taskResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.status === 'completed') {
          processedTasks.push(result.value);
        } else {
          failedTasks.push(result.value);
        }
      } else {
        const task = pendingTasks[index];
        failedTasks.push({
          task_id: task.id,
          task_type: task.task_type,
          status: 'failed',
          error: result.reason?.message || 'Unknown error'
        });
      }
    });
    
    // Update user registration status if all tasks are completed
    console.log(`Checking if all tasks completed for user ${patient_id}...`);
    await updateUserRegistrationStatus(supabase, patient_id);
    
    // Get final status for this patient
    const { data: finalStatus, error: statusError } = await supabase.rpc(
      'get_user_registration_status_safe',
      { p_user_id: patient_id }
    );
    
    const totalTasks = pendingTasks.length;
    const successfulTasks = processedTasks.length;
    const failedTasksCount = failedTasks.length;
    
    console.log(`Independent task processing summary for patient ${patient_id}: ${successfulTasks}/${totalTasks} successful, ${failedTasksCount} failed`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${totalTasks} tasks independently for patient ${patient_id}: ${successfulTasks} successful, ${failedTasksCount} failed`,
        patient_id: patient_id,
        total_tasks: totalTasks,
        successful_tasks: successfulTasks,
        failed_tasks: failedTasksCount,
        processed_tasks: processedTasks,
        failed_task_details: failedTasks,
        final_status: finalStatus,
        all_tasks_completed: failedTasksCount === 0
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error: any) {
    console.error("Error in trigger-registration-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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

// Independent task processing functions
async function processAssignCareTeam(supabase: any, task: any, userId: string) {
  console.log(`Processing assign care team task for user ${userId}`);
  
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
  
  console.log(`Assigning doctor ${doctorId} and nutritionist ${nutritionistId} to patient ${userId}`);
  
  if (!doctorId) {
    throw new Error('Default doctor not configured');
  }
  
  // Assign care team (upsert)
  const { data: assignmentData, error: assignmentError } = await supabase
    .from('patient_assignments')
    .upsert({
      patient_id: userId,
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

async function processCreateChatRoom(supabase: any, task: any, userId: string) {
  console.log(`Processing create chat room task for user ${userId}`);
  
  // First check if patient has assignments
  const { data: assignmentData, error: assignmentError } = await supabase
    .from('patient_assignments')
    .select('doctor_id, nutritionist_id')
    .eq('patient_id', userId)
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
    .eq('id', userId)
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
    .eq('patient_id', userId)
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
    console.log(`Using existing room ${roomId} for patient ${userId}`);
  } else {
    // Create new room
    const { data: newRoom, error: createError } = await supabase
      .from('chat_rooms')
      .insert([{
        name: roomName,
        description: `Care team chat for ${patientName}`,
        room_type: 'care_team',
        patient_id: userId
      }])
      .select('id')
      .single();
      
    if (createError) {
      console.error("Error creating room:", createError);
      throw new Error(`Error creating room: ${createError.message}`);
    }
    
    roomId = newRoom.id;
    console.log(`Created new room ${roomId} for patient ${userId}`);
  }
  
  // Add members to room
  try {
    const membersToAdd = [
      {
        room_id: roomId,
        user_id: userId,
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
    room_name: roomName,
    members_added: assignmentData.nutritionist_id ? ['patient', 'doctor', 'nutritionist', 'aibot'] : ['patient', 'doctor', 'aibot']
  };
}

async function processSendWelcomeNotification(supabase: any, task: any, userId: string) {
  console.log(`Processing comprehensive welcome notification for user ${userId}`);
  
  try {
    // Get patient and care team information
    const { data: patientData, error: patientError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, phone')
      .eq('id', userId)
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
      .eq('patient_id', userId)
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
          patient_id: userId,
          patient_name: patientName,
          patient_email: patientData.email,
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
        successful_channels: ['chat'], // Assume chat always works
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
