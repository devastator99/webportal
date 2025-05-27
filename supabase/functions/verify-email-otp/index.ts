
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode } from "https://deno.land/std@0.82.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  email: string;
  otp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, otp }: RequestBody = await req.json()
    
    console.log(`[Email OTP] Starting verification for email: ${email}`)
    
    if (!email || !otp) {
      console.error('[Email OTP] Missing required fields')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email and OTP are required' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    console.log(`[Email OTP] Cleaned email: ${cleanEmail}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Email OTP] Missing Supabase configuration')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify OTP exists and is valid
    console.log('[Email OTP] Checking OTP validity...')
    const { data: otpRecord, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('email', cleanEmail)
      .eq('otp_code', otp)
      .eq('reset_method', 'email')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (otpError || !otpRecord) {
      console.error('[Email OTP] Invalid or expired OTP:', otpError?.message)
      
      // Check if OTP exists but is expired/used
      const { data: anyOtpRecord } = await supabase
        .from('password_reset_otps')
        .select('*')
        .eq('email', cleanEmail)
        .eq('otp_code', otp)
        .eq('reset_method', 'email')
        .single()

      if (anyOtpRecord) {
        if (anyOtpRecord.used) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'This OTP has already been used. Please request a new OTP.' 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else if (new Date(anyOtpRecord.expires_at) < new Date()) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'This OTP has expired. Please request a new OTP.' 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid OTP. Please check the code and try again.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[Email OTP] OTP is valid, searching for user...')

    // Find user by email using RPC function
    let userId = null
    let userFound = false

    try {
      const { data: userExists, error: rpcError } = await supabase
        .rpc('check_user_exists', { p_email: cleanEmail });
      
      if (rpcError) {
        console.error('[Email OTP] User existence check error:', rpcError);
      } else if (userExists) {
        userFound = true
        console.log('[Email OTP] User found via email auth check')
      }
    } catch (error) {
      console.log('[Email OTP] Email user lookup failed:', error)
    }

    // Mark OTP as used
    const { error: updateError } = await supabase
      .from('password_reset_otps')
      .update({ 
        used: true,
        user_id: userId
      })
      .eq('id', otpRecord.id)

    if (updateError) {
      console.error('[Email OTP] Error marking OTP as used:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to process OTP verification' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If user not found, return error
    if (!userFound) {
      console.log('[Email OTP] No user found for email:', cleanEmail)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `No account found with email address ${email}. Please check your email or create a new account.`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate session token for password reset
    const sessionToken = encode(JSON.stringify({
      email: cleanEmail,
      timestamp: Date.now(),
      purpose: 'password_reset',
      resetMethod: 'email'
    }))

    console.log(`[Email OTP] OTP verified successfully for email: ${cleanEmail}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP verified successfully',
        sessionToken,
        userFound: true
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Email OTP] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'An unexpected error occurred during OTP verification. Please try again.',
        details: error.message 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
