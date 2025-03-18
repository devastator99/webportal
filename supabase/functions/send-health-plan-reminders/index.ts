
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
    const { patientId, nutritionistId } = await req.json()

    // Validate inputs
    if (!patientId || !nutritionistId) {
      throw new Error('Missing required parameters: patientId or nutritionistId')
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

    // Get health plan items
    const { data: healthPlanItems, error: healthPlanError } = await supabaseClient
      .from('health_plan_items')
      .select('*')
      .eq('patient_id', patientId)
      .eq('nutritionist_id', nutritionistId)
      .order('time')

    if (healthPlanError) {
      throw new Error(`Failed to get health plan items: ${healthPlanError.message}`)
    }

    if (!healthPlanItems || healthPlanItems.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No health plan items found for this patient' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    console.log(`Found ${healthPlanItems.length} health plan items for patient`)

    // If the patient has a phone number, send WhatsApp notifications for each item
    if (patientData.phone) {
      try {
        // Send overview message first
        const overviewMessage = `Hello ${patientData.first_name},\n\nHere is your daily health plan reminder:\n\n${healthPlanItems.map((item, index) => 
          `${index + 1}. ${item.time} - ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}: ${item.description}`
        ).join('\n\n')}\n\nYou'll receive individual reminders at the scheduled times.`

        await sendWhatsAppMessage(patientData.phone, overviewMessage)
        console.log('Health plan overview sent successfully')

        // Schedule individual reminders (in a real app, this would use a proper scheduler)
        // Here we're just demonstrating the concept
        for (const item of healthPlanItems) {
          const reminderMessage = `Reminder: ${item.type.charAt(0).toUpperCase() + item.type.slice(1)} at ${item.time}\n\n${item.description}`
          
          // In a real app, you would use a scheduling service instead of sending immediately
          // This is just a placeholder to show the concept
          await sendWhatsAppMessage(patientData.phone, reminderMessage)
          console.log(`Reminder for ${item.type} at ${item.time} sent`)
          
          // Add a small delay between messages to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (whatsAppError) {
        console.error('Failed to send WhatsApp reminders:', whatsAppError)
        throw whatsAppError
      }
    } else {
      console.log('Patient has no phone number for WhatsApp notifications')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Health plan reminders sent successfully',
        itemCount: healthPlanItems.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in send-health-plan-reminders function:', error)
    
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
