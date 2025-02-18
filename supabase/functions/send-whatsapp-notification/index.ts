
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
    const { appointment_id, message } = await req.json()

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get appointment details with patient info
    const { data: appointmentData, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        patient:patient_id (
          phone,
          first_name,
          last_name
        ),
        doctor:doctor_id (
          first_name,
          last_name
        )
      `)
      .eq('id', appointment_id)
      .single()

    if (appointmentError) throw appointmentError
    if (!appointmentData?.patient?.phone) {
      throw new Error('Patient phone number not found')
    }

    // Format the phone number (remove any non-numeric characters and ensure it starts with country code)
    const phoneNumber = appointmentData.patient.phone.replace(/\D/g, '')

    // Send WhatsApp message using Meta's WhatsApp Business API
    const response = await fetch(`https://graph.facebook.com/v17.0/${Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('WHATSAPP_ACCESS_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: 'appointment_confirmation',
          language: {
            code: 'en',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: `${appointmentData.patient.first_name} ${appointmentData.patient.last_name}`,
                },
                {
                  type: 'text',
                  text: `Dr. ${appointmentData.doctor.first_name} ${appointmentData.doctor.last_name}`,
                },
                {
                  type: 'text',
                  text: new Date(appointmentData.scheduled_at).toLocaleString(),
                },
              ],
            },
          ],
        },
      }),
    })

    const whatsappResult = await response.json()

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${JSON.stringify(whatsappResult)}`)
    }

    // Update appointment to mark WhatsApp notification as sent
    const { error: updateError } = await supabaseClient
      .from('appointments')
      .update({ whatsapp_notification_sent: true })
      .eq('id', appointment_id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true, data: whatsappResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending WhatsApp notification:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
