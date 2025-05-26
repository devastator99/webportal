
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode } from "https://deno.land/std@0.82.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  phoneNumber: string;
  otp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phoneNumber, otp }: RequestBody = await req.json()
    
    console.log(`[OTP Verification] Starting verification for phone: ${phoneNumber}`)
    
    if (!phoneNumber || !otp) {
      console.error('[OTP Verification] Missing required fields')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Phone number and OTP are required' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean phone number format
    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`
    console.log(`[OTP Verification] Cleaned phone: ${cleanPhone}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[OTP Verification] Missing Supabase configuration')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Step 1: Verify OTP exists and is valid
    console.log('[OTP Verification] Checking OTP validity...')
    const { data: otpRecord, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('phone_number', cleanPhone)
      .eq('otp_code', otp)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (otpError || !otpRecord) {
      console.error('[OTP Verification] Invalid or expired OTP:', otpError?.message)
      
      // Check if OTP exists but is expired/used
      const { data: anyOtpRecord } = await supabase
        .from('password_reset_otps')
        .select('*')
        .eq('phone_number', cleanPhone)
        .eq('otp_code', otp)
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

    console.log('[OTP Verification] OTP is valid, searching for user...')

    // Step 2: Find user by phone number using multiple strategies
    let userId = null
    let userFound = false
    let searchStrategy = ''

    // Strategy 1: Direct phone lookup in profiles
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle()

      if (profileData && !profileError) {
        userId = profileData.id
        userFound = true
        searchStrategy = 'profiles_phone_exact'
        console.log('[OTP Verification] User found in profiles by exact phone match')
      }
    } catch (error) {
      console.log('[OTP Verification] Profile lookup failed:', error)
    }

    // Strategy 2: Try alternative phone format if not found
    if (!userFound) {
      try {
        const phoneWithoutCountryCode = cleanPhone.replace('+91', '')
        const { data: profileDataAlt, error: profileErrorAlt } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', phoneWithoutCountryCode)
          .maybeSingle()

        if (profileDataAlt && !profileErrorAlt) {
          userId = profileDataAlt.id
          userFound = true
          searchStrategy = 'profiles_phone_without_code'
          console.log('[OTP Verification] User found in profiles by phone without country code')
        }
      } catch (error) {
        console.log('[OTP Verification] Alternative profile lookup failed:', error)
      }
    }

    // Strategy 3: Check patient_details emergency_contact
    if (!userFound) {
      try {
        const { data: patientData, error: patientError } = await supabase
          .from('patient_details')
          .select('id')
          .or(`emergency_contact.eq.${cleanPhone},emergency_contact.eq.${cleanPhone.replace('+91', '')}`)
          .maybeSingle()

        if (patientData && !patientError) {
          userId = patientData.id
          userFound = true
          searchStrategy = 'patient_details_emergency'
          console.log('[OTP Verification] User found in patient_details emergency_contact')
        }
      } catch (error) {
        console.log('[OTP Verification] Patient details lookup failed:', error)
      }
    }

    // Mark OTP as used regardless of user found status
    const { error: updateError } = await supabase
      .from('password_reset_otps')
      .update({ 
        used: true,
        user_id: userId // This will be null if user not found
      })
      .eq('id', otpRecord.id)

    if (updateError) {
      console.error('[OTP Verification] Error marking OTP as used:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to process OTP verification' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If user not found, return clear message about phone number not being registered
    if (!userFound) {
      console.log('[OTP Verification] No user found for phone number:', cleanPhone)
      return new Response(
        JSON.stringify({ 
          success: false,
          needsEmailConfirmation: true,
          phoneNotRegistered: true,
          phoneNumber: cleanPhone,
          error: `The phone number ${phoneNumber} is not registered with any account. Please enter your email address to link this phone number to your account, or contact support if you need assistance.`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate session token for password reset
    const sessionToken = encode(JSON.stringify({
      userId: userId,
      phoneNumber: cleanPhone,
      timestamp: Date.now(),
      purpose: 'password_reset',
      searchStrategy: searchStrategy
    }))

    console.log(`[OTP Verification] OTP verified successfully for user: ${userId} (found via: ${searchStrategy})`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP verified successfully',
        sessionToken,
        userFound: true,
        searchStrategy: searchStrategy
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[OTP Verification] Unexpected error:', error)
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
