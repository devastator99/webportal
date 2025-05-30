
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegistrationTask {
  id: string;
  user_id: string;
  task_type: string;
  status: string;
  retry_count: number;
  priority: number;
  next_retry_at: string;
}

// Process assign_care_team task
async function processAssignCareTeam(supabaseClient: any, task: RegistrationTask) {
  console.log(`Processing assign care team task for user ${task.user_id}`);
  
  try {
    // Get default care team
    const { data: careTeamData, error: careTeamError } = await supabaseClient
      .from('default_care_teams')
      .select('default_doctor_id, default_nutritionist_id')
      .eq('is_active', true)
      .maybeSingle();
      
    if (careTeamError) {
      console.error("Error fetching default care team:", careTeamError);
      throw new Error(`Error fetching default care team: ${careTeamError.message}`);
    }
    
    if (!careTeamData) {
      throw new Error('No active default care team configured');
    }

    const doctorId = careTeamData.default_doctor_id;
    const nutritionistId = careTeamData.default_nutritionist_id;
    
    if (!doctorId) {
      throw new Error('Default doctor not configured in care team settings');
    }
    
    // Create or update assignment
    const { data: assignmentData, error: assignmentError } = await supabaseClient
      .from('patient_assignments')
      .upsert({
        patient_id: task.user_id,
        doctor_id: doctorId,
        nutritionist_id: nutritionistId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'patient_id'
      })
      .select()
      .single();
      
    if (assignmentError) {
      console.error("Care team assignment error:", assignmentError);
      throw new Error(`Error creating care team assignment: ${assignmentError.message}`);
    }
    
    console.log("Care team assigned successfully:", assignmentData);
    return {
      assignment_id: assignmentData.id,
      doctor_id: doctorId,
      nutritionist_id: nutritionistId
    };
    
  } catch (error) {
    console.error(`Error in processAssignCareTeam:`, error);
    throw error;
  }
}

// Process create_chat_room task
async function processCreateChatRoom(supabaseClient: any, task: RegistrationTask) {
  console.log(`Processing create chat room task for user ${task.user_id}`);
  
  try {
    // Get patient's care team assignment
    const { data: careTeam, error: careTeamError } = await supabaseClient
      .from('patient_assignments')
      .select('doctor_id, nutritionist_id')
      .eq('patient_id', task.user_id)
      .single();
    
    if (careTeamError) {
      console.error("No care team assignment found:", careTeamError);
      throw new Error(`Patient has no care team assigned yet: ${careTeamError.message}`);
    }
    
    // Call the get-patient-care-team-room edge function to create/get the room
    const { data: roomData, error: roomError } = await supabaseClient.functions.invoke(
      'get-patient-care-team-room',
      { body: { patient_id: task.user_id } }
    );
    
    if (roomError) {
      console.error("Error creating care team room:", roomError);
      throw new Error(`Failed to create care team room: ${roomError.message}`);
    }
    
    console.log(`Care team room created/found: ${roomData.room_id}`);
    return { success: true, room_id: roomData.room_id };
    
  } catch (error) {
    console.error(`Error in processCreateChatRoom:`, error);
    throw error;
  }
}

// Process send_welcome_notification task  
async function processSendWelcomeNotification(supabaseClient: any, task: RegistrationTask) {
  console.log(`Processing comprehensive welcome notification for user ${task.user_id}`);
  
  try {
    // Get patient profile
    const { data: patientProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select(`
        id, first_name, last_name, phone,
        patient_details (
          gender, date_of_birth, height, weight, blood_group,
          allergies, chronic_conditions, emergency_contact
        )
      `)
      .eq('id', task.user_id)
      .single();
    
    if (profileError) {
      console.error("Cannot retrieve patient profile:", profileError);
      throw new Error(`Cannot retrieve patient profile: ${profileError.message}`);
    }
    
    // Get email from auth.users
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(task.user_id);
    
    if (authError || !authUser.user) {
      console.error("Cannot retrieve auth user:", authError);
      throw new Error(`Cannot retrieve user email: ${authError?.message || 'User not found'}`);
    }
    
    // Get care team assignment with details
    const { data: careTeamData, error: careTeamError } = await supabaseClient
      .from('patient_assignments')
      .select(`
        doctor:doctor_id (
          id, first_name, last_name, specialty
        ),
        nutritionist:nutritionist_id (
          id, first_name, last_name
        )
      `)
      .eq('patient_id', task.user_id)
      .single();
    
    if (careTeamError) {
      console.error("Cannot retrieve care team:", careTeamError);
      throw new Error(`Cannot retrieve care team: ${careTeamError.message}`);
    }
    
    // Prepare notification data
    const notificationData = {
      patient_id: task.user_id,
      patient_email: authUser.user.email,
      patient_phone: patientProfile.phone,
      patient_name: `${patientProfile.first_name || ''} ${patientProfile.last_name || ''}`.trim(),
      doctor_name: careTeamData.doctor ? `Dr. ${careTeamData.doctor.first_name} ${careTeamData.doctor.last_name}` : 'Your assigned doctor',
      nutritionist_name: careTeamData.nutritionist ? `${careTeamData.nutritionist.first_name} ${careTeamData.nutritionist.last_name}` : 'Your assigned nutritionist',
      patient_details: patientProfile.patient_details || {}
    };
    
    // Call the comprehensive welcome notification edge function
    const { data: notificationResult, error: notificationError } = await supabaseClient.functions.invoke(
      'send-comprehensive-welcome-notification',
      { body: notificationData }
    );
    
    if (notificationError) {
      console.error("Welcome notification error:", notificationError);
      throw new Error(`Failed to send comprehensive welcome notification: ${notificationError.message}`);
    }
    
    console.log(`Welcome notification sent successfully for user ${task.user_id}`);
    return { success: true, result: notificationResult };
    
  } catch (error) {
    console.error(`Error in processSendWelcomeNotification:`, error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patient_id } = await req.json();
    
    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: "Patient ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ALL pending tasks for patient: ${patient_id}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get ALL pending tasks for this patient (not just one)
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('registration_tasks')
      .select('*')
      .eq('user_id', patient_id)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
    }

    if (!tasks || tasks.length === 0) {
      console.log(`No pending tasks found for patient: ${patient_id}`);
      return new Response(
        JSON.stringify({ 
          message: "No pending tasks found", 
          patient_id,
          successful_tasks: 0,
          failed_tasks: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${tasks.length} pending tasks for patient ${patient_id}`);

    // Process tasks in the correct order: assign_care_team -> create_chat_room -> send_welcome_notification
    const orderedTasks = tasks.sort((a, b) => {
      const order = { 'assign_care_team': 1, 'create_chat_room': 2, 'send_welcome_notification': 3 };
      return (order[a.task_type] || 999) - (order[b.task_type] || 999);
    });

    let successCount = 0;
    let failedCount = 0;
    const results = [];

    // Process tasks sequentially to avoid dependency issues
    for (const task of orderedTasks) {
      console.log(`Processing task ${task.task_type} (${task.id}) for patient ${patient_id}`);
      
      try {
        let result;
        
        if (task.task_type === 'assign_care_team') {
          result = await processAssignCareTeam(supabaseClient, task);
        } else if (task.task_type === 'create_chat_room') {
          result = await processCreateChatRoom(supabaseClient, task);
        } else if (task.task_type === 'send_welcome_notification') {
          result = await processSendWelcomeNotification(supabaseClient, task);
        } else {
          throw new Error(`Unknown task type: ${task.task_type}`);
        }
        
        // Mark task as completed
        await supabaseClient
          .from('registration_tasks')
          .update({
            status: 'completed',
            result_payload: result,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id);
          
        successCount++;
        results.push({ taskId: task.id, taskType: task.task_type, success: true, result });
        console.log(`Task ${task.task_type} completed successfully`);
        
      } catch (error) {
        console.error(`Error processing task ${task.id} (${task.task_type}):`, error);
        
        // Mark task as failed with retry logic
        const newRetryCount = task.retry_count + 1;
        const maxRetries = 3;
        
        await supabaseClient
          .from('registration_tasks')
          .update({
            status: newRetryCount >= maxRetries ? 'failed' : 'pending',
            retry_count: newRetryCount,
            error_details: { message: error.message, timestamp: new Date().toISOString() },
            next_retry_at: new Date(Date.now() + newRetryCount * 60000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id);
        
        failedCount++;
        results.push({ taskId: task.id, taskType: task.task_type, success: false, error: error.message });
        
        // If a critical task fails (like assign_care_team), don't continue with dependent tasks
        if (task.task_type === 'assign_care_team') {
          console.error(`Critical task assign_care_team failed, stopping processing for patient ${patient_id}`);
          break;
        }
      }
    }

    // Check if all tasks are completed and update user status
    if (successCount === orderedTasks.length) {
      console.log(`All tasks completed for user ${patient_id}, marking as fully_registered`);
      
      await supabaseClient
        .from('profiles')
        .update({ 
          registration_status: 'fully_registered',
          registration_completed_at: new Date().toISOString()
        })
        .eq('id', patient_id);
        
      console.log(`User ${patient_id} registration marked as fully_registered`);
    }

    return new Response(
      JSON.stringify({
        message: "Task processing completed",
        patient_id,
        processed_tasks: orderedTasks.length,
        successful_tasks: successCount,
        failed_tasks: failedCount,
        task_results: results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in trigger-registration-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
