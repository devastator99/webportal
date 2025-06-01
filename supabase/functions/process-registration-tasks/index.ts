
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TaskProcessor {
  [key: string]: (supabase: any, task: any) => Promise<any>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { patient_id, user_id } = await req.json()
    const userId = patient_id || user_id
    
    console.log('Processing registration tasks for user:', userId)

    // Get pending tasks for the user
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('registration_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('priority', { ascending: true })

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!tasks || tasks.length === 0) {
      console.log('No pending tasks found for user:', userId)
      return new Response(
        JSON.stringify({ success: true, message: 'No pending tasks found', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${tasks.length} pending tasks for user ${userId}`)

    const taskProcessors: TaskProcessor = {
      'assign_care_team': async (supabase, task) => {
        // Get user role to check if this is a patient
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', task.user_id)
          .single()

        if (userRole?.role !== 'patient') {
          return { skipped: true, reason: 'Not applicable for professionals' }
        }

        // Get default care team
        const { data: defaultCareTeam } = await supabase
          .from('default_care_teams')
          .select('*')
          .eq('is_active', true)
          .single()

        if (!defaultCareTeam) {
          throw new Error('No active default care team found')
        }

        const { data: assignmentResult, error: assignError } = await supabase.rpc('admin_assign_care_team', {
          p_patient_id: task.user_id,
          p_doctor_id: defaultCareTeam.default_doctor_id,
          p_nutritionist_id: defaultCareTeam.default_nutritionist_id,
          p_admin_id: defaultCareTeam.default_doctor_id // Use doctor as admin for assignment
        })

        if (assignError) {
          throw new Error(`Care team assignment failed: ${assignError.message}`)
        }

        // Check if the RPC returned success in the response data
        if (!assignmentResult || !assignmentResult.success) {
          const errorMsg = assignmentResult?.error || 'Care team assignment returned failure'
          throw new Error(`Care team assignment failed: ${errorMsg}`)
        }

        return { care_team_assigned: true, assignment_id: assignmentResult.id }
      },

      'create_chat_room': async (supabase, task) => {
        console.log(`Creating chat room for user ${task.user_id}`)
        
        // Call the get-patient-care-team-room edge function to create/get the room
        const { data: roomData, error: roomError } = await supabase.functions.invoke(
          'get-patient-care-team-room',
          { body: { patient_id: task.user_id } }
        )
        
        if (roomError) {
          console.error("Error creating care team room:", roomError)
          throw new Error(`Failed to create care team room: ${roomError.message}`)
        }
        
        // Check if we actually got a valid room ID
        const roomId = roomData?.room_id || roomData?.id || roomData
        if (!roomId) {
          console.error("No room ID returned from care team room creation")
          throw new Error('Failed to create care team room: No room ID returned')
        }
        
        console.log(`Care team room created/found: ${roomId}`)
        return { success: true, room_id: roomId }
      },

      'send_welcome_notification': async (supabase, task) => {
        // Get user profile and role
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', task.user_id)
          .single()

        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', task.user_id)
          .single()

        const { data: user } = await supabase.auth.admin.getUserById(task.user_id)

        if (!profile || !userRole || !user.user) {
          throw new Error('Failed to fetch user details')
        }

        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        const email = user.user.email

        console.log(`Sending welcome notification for ${userRole.role}: ${fullName} (${email})`)

        // Send comprehensive welcome notification
        const { data: notificationResult, error: notificationError } = await supabase.functions.invoke(
          'send-comprehensive-welcome-notification',
          {
            body: {
              patient_id: task.user_id,
              patient_email: email,
              patient_phone: profile.phone,
              patient_name: fullName,
              patient_details: {
                role: userRole.role,
                registration_type: userRole.role === 'patient' ? 'patient' : 'professional'
              }
            }
          }
        )

        if (notificationError) {
          throw new Error(`Notification failed: ${notificationError.message}`)
        }

        return { notification_sent: true, result: notificationResult }
      },

      'setup_professional_profile': async (supabase, task) => {
        // Get user role
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', task.user_id)
          .single()

        if (!userRole || !['doctor', 'nutritionist'].includes(userRole.role)) {
          throw new Error('Invalid user role for professional profile setup')
        }

        console.log(`Setting up professional profile for ${userRole.role}: ${task.user_id}`)

        // Create professional details table entry if it doesn't exist
        if (userRole.role === 'doctor') {
          const { error: doctorError } = await supabase
            .from('doctor_details')
            .upsert({
              id: task.user_id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (doctorError && !doctorError.message.includes('already exists')) {
            console.warn('Error creating doctor details:', doctorError)
          }
        } else if (userRole.role === 'nutritionist') {
          // Create nutritionist_details table if it doesn't exist
          try {
            await supabase.rpc('create_nutritionist_details_if_not_exists', {
              p_user_id: task.user_id
            })
          } catch (error) {
            console.warn('Error creating nutritionist details:', error)
          }
        }

        return { profile_setup: true, role: userRole.role }
      }
    }

    let processedCount = 0
    const results = []

    for (const task of tasks) {
      try {
        console.log(`Processing task: ${task.task_type} for user ${task.user_id}`)

        // Mark task as in progress
        await supabaseClient
          .from('registration_tasks')
          .update({ 
            status: 'in_progress', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', task.id)

        // Process the task
        const processor = taskProcessors[task.task_type]
        if (!processor) {
          throw new Error(`No processor found for task type: ${task.task_type}`)
        }

        const result = await processor(supabaseClient, task)

        // Mark task as completed
        await supabaseClient
          .from('registration_tasks')
          .update({ 
            status: 'completed', 
            updated_at: new Date().toISOString(),
            result_payload: result
          })
          .eq('id', task.id)

        console.log(`Task ${task.task_type} completed successfully`)
        processedCount++
        results.push({ task_type: task.task_type, status: 'completed', result })

      } catch (error) {
        console.error(`Error processing task ${task.task_type}:`, error)
        
        // Mark task as failed and increment retry count
        await supabaseClient
          .from('registration_tasks')
          .update({ 
            status: 'failed', 
            updated_at: new Date().toISOString(),
            retry_count: task.retry_count + 1,
            error_details: { error: error.message, timestamp: new Date().toISOString() },
            next_retry_at: new Date(Date.now() + (task.retry_count + 1) * 5 * 60 * 1000).toISOString() // Exponential backoff
          })
          .eq('id', task.id)

        results.push({ task_type: task.task_type, status: 'failed', error: error.message })
      }
    }

    // Update registration status if all critical tasks are completed
    if (processedCount > 0) {
      const { data: remainingTasks } = await supabaseClient
        .from('registration_tasks')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'pending')

      if (!remainingTasks || remainingTasks.length === 0) {
        await supabaseClient
          .from('profiles')
          .update({ 
            registration_status: 'fully_registered',
            registration_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        console.log(`Registration completed for user ${userId}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount, 
        total_tasks: tasks.length,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An unexpected error occurred',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
