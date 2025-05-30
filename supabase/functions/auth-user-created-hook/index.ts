
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserCreatedPayload {
  type: 'user.created'
  table: string
  record: {
    id: string
    aud: string
    role: string
    email: string
    email_confirmed_at: string | null
    phone: string | null
    phone_confirmed_at: string | null
    last_sign_in_at: string | null
    app_metadata: Record<string, any>
    user_metadata: {
      user_type_string?: string
      first_name?: string
      last_name?: string
      phone?: string
      primary_contact?: string
      // Patient specific data
      age?: string
      gender?: string
      bloodGroup?: string
      allergies?: string
      emergencyContact?: string
      height?: string
      birthDate?: string
      foodHabit?: string
      knownAllergies?: string
      currentMedicalConditions?: string
    }
    identities: any[]
    created_at: string
    updated_at: string
  }
  schema: string
  old_record: null
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Auth hook triggered')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: UserCreatedPayload = await req.json()
    console.log('Received payload:', JSON.stringify(payload, null, 2))

    if (payload.type !== 'user.created') {
      console.log('Ignoring non-user.created event:', payload.type)
      return new Response(JSON.stringify({ message: 'Event type not handled' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const user = payload.record
    const metadata = user.user_metadata || {}
    
    console.log('Processing user creation for:', user.id)
    console.log('User metadata:', metadata)

    // Extract user information from metadata
    const userType = metadata.user_type_string || 'patient'
    const firstName = metadata.first_name
    const lastName = metadata.last_name
    const phone = metadata.phone

    console.log('User details:', { userType, firstName, lastName, phone })

    // Validate required fields
    if (!firstName || !lastName) {
      console.error('Missing required user information:', { firstName, lastName })
      return new Response(JSON.stringify({ 
        error: 'Missing required user information',
        details: { firstName: !!firstName, lastName: !!lastName }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate user type
    const validRoles = ['patient', 'doctor', 'nutritionist', 'administrator', 'reception']
    if (!validRoles.includes(userType)) {
      console.error('Invalid user type:', userType)
      return new Response(JSON.stringify({ 
        error: 'Invalid user type',
        userType,
        validRoles 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Step 1: Create user profile
    console.log('Creating user profile...')
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return new Response(JSON.stringify({ 
        error: 'Failed to create user profile',
        details: profileError 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Profile created successfully')

    // Step 2: Create user role
    console.log('Creating user role...')
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: userType,
        created_at: new Date().toISOString()
      })

    if (roleError) {
      console.error('Error creating user role:', roleError)
      return new Response(JSON.stringify({ 
        error: 'Failed to create user role',
        details: roleError 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('User role created successfully')

    // Step 3: Handle patient-specific data if user is a patient
    if (userType === 'patient') {
      console.log('Processing patient-specific data...')
      
      const patientData = {
        p_user_id: user.id,
        p_age: metadata.age ? parseInt(metadata.age, 10) : null,
        p_gender: metadata.gender || null,
        p_blood_group: metadata.bloodGroup || null,
        p_allergies: metadata.knownAllergies || metadata.allergies || null,
        p_emergency_contact: metadata.emergencyContact || phone || null,
        p_height: metadata.height ? parseFloat(metadata.height) : null,
        p_birth_date: metadata.birthDate || null,
        p_food_habit: metadata.foodHabit || null,
        p_current_medical_conditions: metadata.currentMedicalConditions || null
      }

      console.log('Patient data to insert:', patientData)

      const { error: patientError } = await supabaseClient.rpc(
        'upsert_patient_details',
        patientData
      )

      if (patientError) {
        console.error('Error creating patient details:', patientError)
        // Don't fail the whole process for patient details, just log the error
        console.log('Continuing without patient details due to error')
      } else {
        console.log('Patient details created successfully')
      }
    }

    // Step 4: Assign default care team for patients
    if (userType === 'patient') {
      console.log('Assigning default care team...')
      
      try {
        const { data: defaultCareTeam, error: careTeamError } = await supabaseClient
          .from('default_care_teams')
          .select('default_doctor_id, default_nutritionist_id')
          .eq('is_active', true)
          .single()

        if (!careTeamError && defaultCareTeam) {
          const { error: assignmentError } = await supabaseClient
            .from('patient_assignments')
            .insert({
              patient_id: user.id,
              doctor_id: defaultCareTeam.default_doctor_id,
              nutritionist_id: defaultCareTeam.default_nutritionist_id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (assignmentError) {
            console.error('Error assigning default care team:', assignmentError)
          } else {
            console.log('Default care team assigned successfully')
          }
        } else {
          console.log('No active default care team found')
        }
      } catch (error) {
        console.error('Error in care team assignment:', error)
      }
    }

    console.log('User creation hook completed successfully')

    return new Response(JSON.stringify({ 
      message: 'User creation processed successfully',
      userId: user.id,
      userType,
      profileCreated: true,
      roleCreated: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in auth hook:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
