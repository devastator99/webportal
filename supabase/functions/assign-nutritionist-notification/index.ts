
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// Get the Supabase URL and key from environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Create a Supabase client with the service role key for admin operations
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { nutritionistId, patientId, prescriptionId } = await req.json()
    
    if (!nutritionistId || !patientId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get nutritionist and patient details using the admin client
    const { data: nutritionist, error: nutritionistError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', nutritionistId)
      .single()
    
    if (nutritionistError || !nutritionist) {
      console.error('Error fetching nutritionist:', nutritionistError)
      return new Response(JSON.stringify({ error: 'Nutritionist not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data: patient, error: patientError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', patientId)
      .single()
    
    if (patientError || !patient) {
      console.error('Error fetching patient:', patientError)
      return new Response(JSON.stringify({ error: 'Patient not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get prescription details if available
    let prescriptionDetails = null
    if (prescriptionId) {
      const { data: prescription, error: prescriptionError } = await supabaseAdmin
        .from('medical_records')
        .select('diagnosis, prescription, notes')
        .eq('id', prescriptionId)
        .single()
      
      if (!prescriptionError) {
        prescriptionDetails = prescription
      }
    }

    // Construct message
    const message = `Hello ${nutritionist.first_name}, 
    
You have been assigned a new patient: ${patient.first_name} ${patient.last_name}.
${prescriptionDetails ? `\nDiagnosis: ${prescriptionDetails.diagnosis}` : ''}
${prescriptionDetails ? `\nPrescription: ${prescriptionDetails.prescription}` : ''}
${prescriptionDetails && prescriptionDetails.notes ? `\nNotes: ${prescriptionDetails.notes}` : ''}

Please log in to create a health plan for this patient.`

    // If nutritionist has a phone number, send WhatsApp notification
    if (nutritionist.phone) {
      try {
        // Call the WhatsApp notification edge function or service
        await supabaseAdmin.functions.invoke('send-whatsapp-notification', {
          body: {
            to: nutritionist.phone,
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
        message: `Notification sent to nutritionist ${nutritionist.first_name} ${nutritionist.last_name}` 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in assign-nutritionist-notification:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
