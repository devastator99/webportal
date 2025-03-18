
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// Get environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Create Supabase client with admin privileges
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { patientId, nutritionistId, planItems } = await req.json()
    
    if (!patientId || !nutritionistId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get patient and nutritionist details
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', patientId)
      .single()
    
    if (patientError || !patient) {
      console.error('Error fetching patient:', patientError)
      return new Response(JSON.stringify({ error: 'Patient not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data: nutritionist, error: nutritionistError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', nutritionistId)
      .single()
    
    if (nutritionistError || !nutritionist) {
      console.error('Error fetching nutritionist:', nutritionistError)
      return new Response(JSON.stringify({ error: 'Nutritionist not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Construct the message
    const itemCount = typeof planItems === 'number' ? planItems : 'multiple'
    const message = `Hello ${patient.first_name},

Your nutritionist ${nutritionist.first_name} ${nutritionist.last_name} has created a personalized health plan for you with ${itemCount} items.

Please log in to view your complete health plan and set up reminders.

Best regards,
Your Healthcare Team`

    // Send WhatsApp notification if phone number is available
    if (patient.phone) {
      try {
        // Use the WhatsApp notification edge function
        await supabaseAdmin.functions.invoke('send-whatsapp-notification', {
          body: {
            to: patient.phone,
            message: message
          }
        })
      } catch (whatsappError) {
        console.error('Error sending WhatsApp notification:', whatsappError)
        // Don't fail the entire operation if WhatsApp notification fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Health plan notification sent to ${patient.first_name} ${patient.last_name}` 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in send-health-plan-notification:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
