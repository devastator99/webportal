
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

// Process assign_care_team task - FIXED to use working default care team logic
async function processAssignCareTeam(supabaseClient: any, task: RegistrationTask) {
  console.log(`Processing assign care team task for user ${task.user_id}`);
  
  try {
    // Check if user is a patient using correct table
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', task.user_id)
      .single();
    
    if (roleError || !userRole || userRole.role !== 'patient') {
      console.log(`Skipping care team assignment for non-patient user ${task.user_id}`);
      return { success: true, message: 'Care team assignment skipped for non-patient user' };
    }
    
    // Check if already assigned
    const { data: existingAssignment, error: assignmentError } = await supabaseClient
      .from('patient_assignments')
      .select('*')
      .eq('patient_id', task.user_id)
      .single();
    
    if (!assignmentError && existingAssignment) {
      console.log(`Care team already assigned for patient ${task.user_id}`);
      return { success: true, assignment_id: existingAssignment.id };
    }
    
    // Use the working default care team logic from process-registration-tasks
    const { data: defaultCareTeam, error: careTeamError } = await supabaseClient
      .from('default_care_teams')
      .select('*')
      .eq('is_active', true)
      .single();

    if (careTeamError || !defaultCareTeam) {
      throw new Error('No active default care team found');
    }

    console.log(`Using default care team - Doctor: ${defaultCareTeam.default_doctor_id}, Nutritionist: ${defaultCareTeam.default_nutritionist_id}`);

    // Use the admin_assign_care_team RPC function that already works
    const { error: assignError } = await supabaseClient.rpc('admin_assign_care_team', {
      p_patient_id: task.user_id,
      p_doctor_id: defaultCareTeam.default_doctor_id,
      p_nutritionist_id: defaultCareTeam.default_nutritionist_id,
      p_admin_id: defaultCareTeam.default_doctor_id // Use doctor as admin for assignment
    });

    if (assignError) {
      throw new Error(`Care team assignment failed: ${assignError.message}`);
    }
    
    console.log(`Care team assigned successfully for patient ${task.user_id}`);
    return { success: true, care_team_assigned: true };
    
  } catch (error) {
    console.error(`Error in processAssignCareTeam:`, error);
    throw error;
  }
}

// Process create_chat_room task
async function processCreateChatRoom(supabaseClient: any, task: RegistrationTask) {
  console.log(`Processing create chat room task for user ${task.user_id}`);
  
  try {
    // Check if user is a patient using correct table
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', task.user_id)
      .single();
    
    if (roleError || !userRole || userRole.role !== 'patient') {
      console.log(`Skipping chat room creation for non-patient user ${task.user_id}`);
      return { success: true, message: 'Chat room creation skipped for non-patient user' };
    }
    
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

// Process send_welcome_notification task - FIXED to use correct table
async function processSendWelcomeNotification(supabaseClient: any, task: RegistrationTask) {
  console.log(`Processing comprehensive welcome notification for user ${task.user_id}`);
  
  try {
    // Get user role using correct table
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', task.user_id)
      .single();
    
    if (roleError || !userRole) {
      throw new Error(`Cannot retrieve user role: ${roleError?.message || 'Role not found'}`);
    }
    
    // Get user profile (no user_type field)
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select(`
        id, first_name, last_name, phone
      `)
      .eq('id', task.user_id)
      .single();
    
    if (profileError) {
      console.error("Cannot retrieve user profile:", profileError);
      throw new Error(`Cannot retrieve user profile: ${profileError.message}`);
    }
    
    // Get email from auth.users
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(task.user_id);
    
    if (authError || !authUser.user) {
      console.error("Cannot retrieve auth user:", authError);
      throw new Error(`Cannot retrieve user email: ${authError?.message || 'User not found'}`);
    }
    
    let notificationData = {
      user_id: task.user_id,
      user_email: authUser.user.email,
      user_phone: userProfile.phone,
      user_name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
      user_type: userRole.role
    };
    
    // For patients, get care team details
    if (userRole.role === 'patient') {
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
      
      // Get patient details
      const { data: patientDetails, error: detailsError } = await supabaseClient
        .from('profiles')
        .select(`
          patient_details (
            gender, date_of_birth, height, weight, blood_group,
            allergies, chronic_conditions, emergency_contact
          )
        `)
        .eq('id', task.user_id)
        .single();
      
      notificationData = {
        ...notificationData,
        patient_id: task.user_id,
        patient_email: authUser.user.email,
        patient_phone: userProfile.phone,
        patient_name: notificationData.user_name,
        doctor_name: careTeamData.doctor ? `Dr. ${careTeamData.doctor.first_name} ${careTeamData.doctor.last_name}` : 'Your assigned doctor',
        nutritionist_name: careTeamData.nutritionist ? `${careTeamData.nutritionist.first_name} ${careTeamData.nutritionist.last_name}` : 'Your assigned nutritionist',
        patient_details: patientDetails?.patient_details || {}
      };
      
      // Call the comprehensive welcome notification edge function for patients
      const { data: notificationResult, error: notificationError } = await supabaseClient.functions.invoke(
        'send-comprehensive-welcome-notification',
        { body: notificationData }
      );
      
      if (notificationError) {
        console.error("Patient welcome notification error:", notificationError);
        throw new Error(`Failed to send patient welcome notification: ${notificationError.message}`);
      }
      
      console.log(`Patient welcome notification sent successfully for user ${task.user_id}`);
      return { success: true, result: notificationResult };
    } else {
      // For professionals (doctors/nutritionists), send a simpler welcome notification
      const { data: notificationResult, error: notificationError } = await supabaseClient.functions.invoke(
        'send-email-notification',
        { 
          body: {
            to: authUser.user.email,
            subject: `Welcome to HealthCare Platform - ${userRole.role.charAt(0).toUpperCase() + userRole.role.slice(1)} Account`,
            html: `
              <h2>Welcome ${notificationData.user_name}!</h2>
              <p>Your ${userRole.role} account has been successfully created.</p>
              <p>You can now access your dashboard and start using the platform.</p>
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
            `
          }
        }
      );
      
      if (notificationError) {
        console.error("Professional welcome notification error:", notificationError);
        throw new Error(`Failed to send professional welcome notification: ${notificationError.message}`);
      }
      
      console.log(`Professional welcome notification sent successfully for user ${task.user_id}`);
      return { success: true, result: notificationResult };
    }
    
  } catch (error) {
    console.error(`Error in processSendWelcomeNotification:`, error);
    throw error;
  }
}

// Mark task as completed
async function markTaskCompleted(supabaseClient: any, taskId: string, result: any) {
  const { error } = await supabaseClient
    .from('registration_tasks')
    .update({
      status: 'completed',
      result_payload: result,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);
    
  if (error) {
    console.error(`Error marking task ${taskId} as completed:`, error);
  }
}

// Mark task as failed
async function markTaskFailed(supabaseClient: any, taskId: string, error: any, retryCount: number) {
  const { error: updateError } = await supabaseClient
    .from('registration_tasks')
    .update({
      status: retryCount >= 3 ? 'failed' : 'pending',
      retry_count: retryCount + 1,
      error_details: { message: error.message, timestamp: new Date().toISOString() },
      next_retry_at: new Date(Date.now() + (retryCount + 1) * 60000).toISOString(), // Exponential backoff
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);
    
  if (updateError) {
    console.error(`Error updating failed task ${taskId}:`, updateError);
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

    console.log(`Triggering registration notifications for user: ${patient_id}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get pending tasks for this user
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
      console.log(`No pending tasks found for user: ${patient_id}`);
      return new Response(
        JSON.stringify({ message: "No pending tasks found", user_id: patient_id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${tasks.length} pending tasks for user ${patient_id}: ${tasks.map(t => `${t.task_type} (retry: ${t.retry_count})`).join(', ')}`);

    // Process tasks in parallel with independent error handling
    console.log(`Processing ${tasks.length} tasks in parallel for user ${patient_id}`);
    
    const taskResults = await Promise.allSettled(
      tasks.map(async (task) => {
        console.log(`Starting independent processing of task ${task.task_type} for user ${patient_id}`);
        try {
          let result;
          
          if (task.task_type === 'assign_care_team') {
            console.log(`Processing assign_care_team task ${task.id}`);
            result = await processAssignCareTeam(supabaseClient, task);
          } else if (task.task_type === 'create_chat_room') {
            console.log(`Processing create_chat_room task ${task.id}`);
            result = await processCreateChatRoom(supabaseClient, task);
          } else if (task.task_type === 'send_welcome_notification') {
            console.log(`Processing send_welcome_notification task ${task.id}`);
            result = await processSendWelcomeNotification(supabaseClient, task);
          } else {
            throw new Error(`Unknown task type: ${task.task_type}`);
          }
          
          await markTaskCompleted(supabaseClient, task.id, result);
          return { taskId: task.id, taskType: task.task_type, success: true, result };
          
        } catch (error) {
          console.error(`Error processing task ${task.id} (${task.task_type}): ${error}`);
          await markTaskFailed(supabaseClient, task.id, error, task.retry_count);
          return { taskId: task.id, taskType: task.task_type, success: false, error: error.message };
        }
      })
    );

    // Count successful and failed tasks
    const successCount = taskResults.filter(result => result.status === 'fulfilled' && result.value.success).length;
    const failedCount = taskResults.length - successCount;
    
    console.log(`Independent task processing summary for user ${patient_id}: ${successCount}/${tasks.length} successful, ${failedCount} failed`);

    // Check if all tasks are completed
    console.log(`Checking if all tasks completed for user ${patient_id}...`);
    
    const { data: pendingTasks, error: pendingError } = await supabaseClient
      .from('registration_tasks')
      .select('id')
      .eq('user_id', patient_id)
      .eq('status', 'pending');
    
    if (pendingError) {
      console.error("Error checking pending tasks:", pendingError);
    } else {
      console.log(`Checking pending tasks for user ${patient_id}...`);
      console.log(`Found ${pendingTasks?.length || 0} pending tasks for user ${patient_id}`);
      
      if (!pendingTasks || pendingTasks.length === 0) {
        console.log(`Marking user ${patient_id} as fully_registered...`);
        
        // Update user registration status to fully_registered
        const { error: statusError } = await supabaseClient
          .from('profiles')
          .update({ 
            registration_status: 'fully_registered',
            registration_completed_at: new Date().toISOString()
          })
          .eq('id', patient_id);
        
        if (statusError) {
          console.error(`Error updating registration status:`, statusError);
        } else {
          console.log(`User ${patient_id} registration marked as fully_registered`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Task processing completed",
        user_id: patient_id,
        processed_tasks: tasks.length,
        successful_tasks: successCount,
        failed_tasks: failedCount,
        task_results: taskResults.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason })
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
