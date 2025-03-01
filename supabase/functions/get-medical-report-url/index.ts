
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle CORS preflight requests
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the report ID from the request
    const { reportId } = await req.json()
    if (!reportId) {
      return new Response(
        JSON.stringify({ error: 'Report ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Processing request for report ID:', reportId)

    // Initialize Supabase client with auth from the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? '',
          },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('Authentication error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - User not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('Authenticated as user:', user.id)

    // Get the report details
    const { data: reportData, error: reportError } = await supabaseClient
      .from('patient_medical_reports')
      .select('file_path, patient_id')
      .eq('id', reportId)
      .single()

    if (reportError || !reportData) {
      console.error('Error fetching report:', reportError)
      return new Response(
        JSON.stringify({ error: 'Report not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    console.log('Report data found:', reportData)

    // Check authorization - is this the patient's record or an authorized role?
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isAuthorized = 
      user.id === reportData.patient_id || 
      (userRoles && ['administrator', 'doctor'].includes(userRoles.role))

    if (!isAuthorized) {
      console.error('User not authorized to access this report')
      return new Response(
        JSON.stringify({ error: 'Not authorized to access this report' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log('User is authorized to access the report')

    // Using service role to get a signed URL
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate signed URL
    const { data: signedUrl, error: signedUrlError } = await serviceRoleClient
      .storage
      .from('patient_medical_reports')
      .createSignedUrl(reportData.file_path, 60 * 10) // 10 minutes expiry

    if (signedUrlError) {
      console.error('Error generating signed URL:', signedUrlError)
      return new Response(
        JSON.stringify({ error: 'Could not generate access URL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Signed URL generated successfully')

    // Return the signed URL
    return new Response(
      JSON.stringify(signedUrl),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
