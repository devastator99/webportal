
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
    const { patientId, nutritionistId } = await req.json()
    
    if (!patientId) {
      return new Response(JSON.stringify({ error: 'Missing patient ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get patient details
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

    // Get health plan items using RPC function
    const { data: healthPlanItems, error: healthPlanError } = await supabaseAdmin
      .rpc('get_patient_health_plan', {
        p_patient_id: patientId
      })
    
    if (healthPlanError) {
      console.error('Error fetching health plan:', healthPlanError)
      return new Response(JSON.stringify({ error: 'Failed to fetch health plan' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!healthPlanItems || healthPlanItems.length === 0) {
      return new Response(JSON.stringify({ error: 'No health plan items found for this patient' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Group health plan items by type
    const foodItems = healthPlanItems.filter(item => item.type === 'food')
    const exerciseItems = healthPlanItems.filter(item => item.type === 'exercise')
    const medicationItems = healthPlanItems.filter(item => item.type === 'medication')

    // Create reminder message
    let reminderMessage = `Hello ${patient.first_name},\n\nHere's your daily health plan:\n\n`
    
    if (foodItems.length > 0) {
      reminderMessage += "🍎 MEAL PLAN:\n"
      foodItems.forEach(item => {
        reminderMessage += `${item.scheduled_time}: ${item.description}\n`
      })
      reminderMessage += "\n"
    }
    
    if (exerciseItems.length > 0) {
      reminderMessage += "💪 EXERCISE PLAN:\n"
      exerciseItems.forEach(item => {
        reminderMessage += `${item.scheduled_time}: ${item.description}`
        if (item.duration) reminderMessage += ` (${item.duration})`
        reminderMessage += "\n"
      })
      reminderMessage += "\n"
    }
    
    if (medicationItems.length > 0) {
      reminderMessage += "💊 MEDICATION SCHEDULE:\n"
      medicationItems.forEach(item => {
        reminderMessage += `${item.scheduled_time}: ${item.description}\n`
      })
      reminderMessage += "\n"
    }
    
    reminderMessage += "Remember to follow your health plan for the best results. If you have any questions, please contact your nutritionist or doctor."

    // Send WhatsApp reminders if phone number is available
    let notificationSent = false
    if (patient.phone) {
      try {
        // Use the WhatsApp notification edge function
        await supabaseAdmin.functions.invoke('send-whatsapp-notification', {
          body: {
            to: patient.phone,
            message: reminderMessage
          }
        })
        notificationSent = true
      } catch (whatsappError) {
        console.error('Error sending WhatsApp notification:', whatsappError)
      }
    }

    if (notificationSent) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Health plan reminders sent to ${patient.first_name} ${patient.last_name}` 
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Failed to send reminders - no phone number available for ${patient.first_name} ${patient.last_name}` 
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('Error in send-health-plan-reminders:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
