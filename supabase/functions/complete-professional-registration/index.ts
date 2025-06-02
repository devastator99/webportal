
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

    // Get user details for comprehensive notification
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

    console.log('Sending comprehensive welcome notification with phone:', finalPhone)

    // Send comprehensive welcome notification immediately
    try {
      const { data: notificationResult, error: notificationError } = await supabaseClient.functions.invoke(
        'send-comprehensive-welcome-notification',
        {
          body: {
            patient_id: user_id,
            patient_email: `${user_id}@temp.placeholder`, // Will be ignored in favor of phone
            patient_phone: finalPhone,
            patient_name: `${userProfile.first_name} ${userProfile.last_name}`,
            patient_details: {
              role: userRole.role,
              phone: finalPhone
            }
          }
        }
      )

      if (notificationError) {
        console.error('Welcome notification failed:', notificationError)
        // Don't fail the entire process if notification fails
      } else {
        console.log('Welcome notification sent successfully:', notificationResult)
      }
    } catch (notificationErr) {
      console.error('Exception during welcome notification:', notificationErr)
      // Don't fail the entire process if notification fails
    }

    // Update the registration task as completed
    try {
      const { error: taskUpdateError } = await supabaseClient
        .from('registration_tasks')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString(),
          result_payload: {
            notification_sent: true,
            phone: finalPhone,
            completed_at: new Date().toISOString()
          }
        })
        .eq('user_id', user_id)
        .eq('task_type', 'complete_professional_registration')

      if (taskUpdateError) {
        console.error('Failed to update registration task:', taskUpdateError)
      }

      // Also update welcome notification task
      const { error: welcomeTaskError } = await supabaseClient
        .from('registration_tasks')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString(),
          result_payload: {
            notification_sent: true,
            phone: finalPhone,
            completed_at: new Date().toISOString()
          }
        })
        .eq('user_id', user_id)
        .eq('task_type', 'send_welcome_notification')

      if (welcomeTaskError) {
        console.error('Failed to update welcome notification task:', welcomeTaskError)
      }
    } catch (taskErr) {
      console.error('Exception updating tasks:', taskErr)
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
            notification_sent: true
          },
          level: 'info',
          message: 'Professional registration completed successfully with notifications',
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
        notification_sent: true
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
