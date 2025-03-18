
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the request body
    const { patientId, nutritionistId, planItems } = await req.json()

    // Validate inputs
    if (!patientId || !nutritionistId || !planItems) {
      throw new Error('Missing required parameters: patientId, nutritionistId, or planItems')
    }

    // Get nutritionist details
    const { data: nutritionistData, error: nutritionistError } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', nutritionistId)
      .single()

    if (nutritionistError || !nutritionistData) {
      throw new Error(`Failed to get nutritionist details: ${nutritionistError?.message || 'Not found'}`)
    }

    // Get patient details
    const { data: patientData, error: patientError } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', patientId)
      .single()

    if (patientError || !patientData) {
      throw new Error(`Failed to get patient details: ${patientError?.message || 'Not found'}`)
    }

    console.log('Retrieved all necessary data for notification')

    // If the patient has a phone number, send WhatsApp notification
    if (patientData.phone) {
      try {
        // Prepare message content
        const message = `Hello ${patientData.first_name},\n\nYour nutrition and health specialist ${nutritionistData.first_name} ${nutritionistData.last_name} has created a personalized health plan for you with ${planItems} items.\n\nCheck your health plan for diet recommendations, exercise routines, and medication schedules.\n\nYou will receive reminders for each item in your health plan through WhatsApp.`

        // Send the WhatsApp notification
        await sendWhatsAppMessage(patientData.phone, message)
        console.log('WhatsApp notification sent successfully')
      } catch (whatsAppError) {
        // Log error but don't fail the entire function
        console.error('Failed to send WhatsApp notification:', whatsAppError)
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Health plan notification sent' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in send-health-plan-notification function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unknown error occurred',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

// Function to send WhatsApp message using WhatsApp Business API
async function sendWhatsAppMessage(to: string, message: string) {
  const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  const whatsappAccessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')

  if (!whatsappPhoneNumberId || !whatsappAccessToken) {
    throw new Error('WhatsApp API credentials not configured')
  }

  // Format the phone number (remove + if present, ensure it has country code)
  const formattedPhone = to.startsWith('+') ? to.substring(1) : to

  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${whatsappPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    throw error
  }
}
