
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Store conversation states
const conversationStates = new Map()

const handleIncomingMessage = async (supabaseClient: any, from: string, message: string) => {
  const state = conversationStates.get(from) || { step: 'initial' }
  let response = ''

  switch (state.step) {
    case 'initial':
      response = "Welcome to our medical appointment system! Please reply with the number of your choice:\n1. Schedule new appointment\n2. Check existing appointment\n3. Cancel appointment"
      state.step = 'menu'
      break

    case 'menu':
      if (message === '1') {
        // Get available doctors
        const { data: doctors } = await supabaseClient
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', await getDoctorIds(supabaseClient))

        state.doctors = doctors
        response = "Please choose a doctor by number:\n" +
          doctors.map((doc: any, index: number) => 
            `${index + 1}. Dr. ${doc.first_name} ${doc.last_name}`
          ).join('\n')
        state.step = 'doctor_selection'
      } else if (message === '2') {
        // Check existing appointments logic
        const appointments = await getExistingAppointments(supabaseClient, from)
        response = appointments.length > 0 
          ? "Your upcoming appointments:\n" + appointments.map(formatAppointment).join('\n')
          : "You have no upcoming appointments."
        state.step = 'initial'
      }
      break

    case 'doctor_selection':
      const selectedIndex = parseInt(message) - 1
      if (selectedIndex >= 0 && selectedIndex < state.doctors.length) {
        state.selectedDoctor = state.doctors[selectedIndex]
        response = "Please enter your preferred date (DD/MM/YYYY):"
        state.step = 'date_selection'
      } else {
        response = "Invalid selection. Please try again."
      }
      break

    case 'date_selection':
      const date = parseDate(message)
      if (date && isValidFutureDate(date)) {
        state.selectedDate = date
        response = "Please choose your preferred time:\n" +
          "1. 09:00 AM\n2. 10:00 AM\n3. 11:00 AM\n4. 02:00 PM\n5. 03:00 PM"
        state.step = 'time_selection'
      } else {
        response = "Invalid date. Please enter a future date in DD/MM/YYYY format."
      }
      break

    case 'time_selection':
      const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00']
      const selectedTime = timeSlots[parseInt(message) - 1]
      
      if (selectedTime) {
        // Create appointment
        const scheduledAt = new Date(state.selectedDate)
        const [hours, minutes] = selectedTime.split(':')
        scheduledAt.setHours(parseInt(hours), parseInt(minutes))

        try {
          const { data: appointment, error } = await supabaseClient
            .rpc('create_appointment', {
              p_patient_id: await getPatientIdFromPhone(supabaseClient, from),
              p_doctor_id: state.selectedDoctor.id,
              p_scheduled_at: scheduledAt.toISOString(),
              p_status: 'scheduled'
            })

          if (error) throw error

          response = `Great! Your appointment has been scheduled with Dr. ${state.selectedDoctor.first_name} ${state.selectedDoctor.last_name} on ${formatDate(scheduledAt)}.`
          state.step = 'initial'
        } catch (error) {
          response = "Sorry, that time slot is not available. Please try another time."
          state.step = 'time_selection'
        }
      } else {
        response = "Invalid time selection. Please choose a number between 1 and 5."
      }
      break

    default:
      response = "Welcome! Let's start over. Please reply with:\n1. Schedule new appointment\n2. Check existing appointment\n3. Cancel appointment"
      state.step = 'menu'
  }

  conversationStates.set(from, state)
  return response
}

// Helper functions
const getDoctorIds = async (supabaseClient: any) => {
  const { data } = await supabaseClient
    .rpc('get_users_by_role', { role_name: 'doctor' })
  return data?.map((d: any) => d.user_id) || []
}

const getPatientIdFromPhone = async (supabaseClient: any, phone: string) => {
  const { data } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .single()
  return data?.id
}

const getExistingAppointments = async (supabaseClient: any, phone: string) => {
  const patientId = await getPatientIdFromPhone(supabaseClient, phone)
  const { data } = await supabaseClient
    .from('appointments')
    .select(`
      scheduled_at,
      doctor:profiles!appointments_doctor_profile_fkey(
        first_name,
        last_name
      )
    `)
    .eq('patient_id', patientId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at')
  return data || []
}

const formatAppointment = (apt: any) => 
  `Dr. ${apt.doctor.first_name} ${apt.doctor.last_name} on ${formatDate(new Date(apt.scheduled_at))}`

const formatDate = (date: Date) => 
  date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

const parseDate = (dateStr: string) => {
  const [day, month, year] = dateStr.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

const isValidFutureDate = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date >= today
}

// Main request handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle incoming webhook from WhatsApp
    if (req.method === 'POST') {
      const body = await req.json()

      // Verify webhook
      if (body.object === 'whatsapp_business_account') {
        // Handle incoming message
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.value.messages) {
              for (const message of change.value.messages) {
                const from = message.from
                const text = message.text?.body

                if (text) {
                  const response = await handleIncomingMessage(supabaseClient, from, text)
                  
                  // Send response back to WhatsApp
                  await fetch(`https://graph.facebook.com/v17.0/${Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${Deno.env.get('WHATSAPP_ACCESS_TOKEN')}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      messaging_product: 'whatsapp',
                      to: from,
                      type: 'text',
                      text: { body: response }
                    })
                  })
                }
              }
            }
          }
        }

        return new Response('OK', { headers: corsHeaders })
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Error processing WhatsApp interaction:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
