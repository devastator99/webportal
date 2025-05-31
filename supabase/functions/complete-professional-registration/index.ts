
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

    console.log('Completing professional registration for user:', user_id)

    // Call the database function to complete professional registration
    const { data: result, error } = await supabaseClient.rpc(
      'complete_professional_registration',
      { 
        p_user_id: user_id,
        p_phone: phone || null
      }
    )

    if (error) {
      console.error('Error completing professional registration:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message || 'Failed to complete professional registration' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!result.success) {
      console.error('Professional registration failed:', result.error)
      return new Response(
        JSON.stringify(result),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Professional registration completed successfully:', result)

    // Trigger task processing for the newly created tasks
    try {
      const { error: processError } = await supabaseClient.functions.invoke(
        'process-registration-tasks',
        {
          body: { user_id: user_id }
        }
      )

      if (processError) {
        console.warn('Failed to trigger task processing:', processError)
        // Don't fail the registration if task processing fails
      } else {
        console.log('Task processing triggered successfully')
      }
    } catch (taskError) {
      console.warn('Error triggering task processing:', taskError)
      // Don't fail the registration if task processing fails
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An unexpected error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
