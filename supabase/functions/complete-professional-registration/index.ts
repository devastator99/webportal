
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { user_id, phone } = await req.json()
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Processing professional registration for user:', user_id, 'with phone:', phone)

    // Get user details for validation
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select(`
        first_name,
        last_name,
        phone
      `)
      .eq('id', user_id)
      .single()

    if (profileError || !userProfile) {
      console.error('Failed to get user profile:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to get user profile: ' + (profileError?.message || 'User not found')
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user role
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .single()

    if (roleError || !userRole) {
      console.error('Failed to get user role:', roleError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to get user role: ' + (roleError?.message || 'Role not found')
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const finalPhone = phone || userProfile.phone
    
    if (!finalPhone) {
      console.error('No phone number available for user:', user_id)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Phone number is required for notifications'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Creating registration tasks for professional:', user_id)

    // Create registration tasks if they don't exist
    const registrationTasks = [
      {
        user_id: user_id,
        task_type: 'send_welcome_notification',
        status: 'pending',
        priority: 1
      },
      {
        user_id: user_id,
        task_type: 'setup_professional_profile',
        status: 'pending',
        priority: 2
      }
    ];

    // Insert tasks (use upsert to avoid duplicates)
    for (const task of registrationTasks) {
      const { error: taskError } = await supabaseClient
        .from('registration_tasks')
        .upsert(
          {
            ...task,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            next_retry_at: new Date().toISOString(),
            retry_count: 0
          },
          { 
            onConflict: 'user_id,task_type',
            ignoreDuplicates: false 
          }
        );

      if (taskError) {
        console.error('Failed to create registration task:', task.task_type, taskError);
      } else {
        console.log('Created registration task:', task.task_type, 'for user:', user_id);
      }
    }

    // Trigger the task processor to handle the registration tasks
    console.log('Triggering task processor for user:', user_id);

    const { data: processorResult, error: processorError } = await supabaseClient.functions.invoke(
      'process-registration-tasks',
      { body: { user_id: user_id } }
    );

    if (processorError) {
      console.error('Failed to process registration tasks:', processorError);
      // Don't fail the entire process if task processing fails
    } else {
      console.log('Registration tasks processed successfully:', processorResult);
    }

    // Log successful completion
    try {
      await supabaseClient
        .from('system_logs')
        .insert({
          user_id: user_id,
          action: 'professional_registration_complete',
          details: {
            role: userRole.role,
            phone: finalPhone,
            tasks_triggered: true
          },
          level: 'info',
          message: 'Professional registration completed with task processing',
          metadata: {
            role: userRole.role,
            phone: finalPhone,
            step: 'professional_complete'
          }
        })
    } catch (logErr) {
      console.error('Failed to log completion:', logErr)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Professional registration completed successfully',
        user_id: user_id,
        phone: finalPhone,
        tasks_created: true,
        tasks_processed: !processorError
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in professional registration:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An unexpected error occurred: ' + error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
