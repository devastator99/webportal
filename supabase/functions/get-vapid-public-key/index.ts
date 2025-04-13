
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

// Get VAPID public key from environment
const VAPID_PUBLIC_KEY = 'BObz8nKixHXF_PxdcJJCDE5joZ3NowjQi6LST2SRl_R_P8DkV6lPmaf-b6Sd62aDyeEVWrV-R4lR9YjXdkqFBQE'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    if (!VAPID_PUBLIC_KEY) {
      return new Response(
        JSON.stringify({ error: 'VAPID_PUBLIC_KEY not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ vapidPublicKey: VAPID_PUBLIC_KEY }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in get-vapid-public-key function:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
