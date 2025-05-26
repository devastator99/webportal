
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
    
    console.log(`[OTP Verification] Request for phone: ${phoneNumber}`)
    
    if (!phoneNumber || !otp) {
      return new Response(
        JSON.stringify({ error: 'Phone number and OTP are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean phone number format
    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('phone_number', cleanPhone)
      .eq('otp_code', otp)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (otpError || !otpRecord) {
      console.error('Invalid or expired OTP:', otpError)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired OTP' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[OTP Verification] Valid OTP found, looking up user with phone: ${cleanPhone}`)

    // Strategy 1: Look up user by phone in profiles table
    let userId = null
    let userFound = false

    // First try to find user by phone in profiles table
    const { data: profileByPhone, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', cleanPhone)
      .single()

    if (profileByPhone && !profileError) {
      userId = profileByPhone.id
      userFound = true
      console.log(`[OTP Verification] User found by phone in profiles: ${userId}`)
    } else {
      console.log(`[OTP Verification] No user found by phone in profiles, trying alternative phone formats`)
      
      // Try without country code
      const phoneWithoutCountryCode = cleanPhone.replace('+91', '')
      const { data: profileByPhoneAlt, error: profileErrorAlt } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phoneWithoutCountryCode)
        .single()

      if (profileByPhoneAlt && !profileErrorAlt) {
        userId = profileByPhoneAlt.id
        userFound = true
        console.log(`[OTP Verification] User found by alternative phone format: ${userId}`)
      }
    }

    // Strategy 2: If not found in profiles, try patient_details emergency_contact
    if (!userFound) {
      console.log(`[OTP Verification] Trying patient_details emergency_contact lookup`)
      const { data: patientDetail, error: lookupError } = await supabase
        .from('patient_details')
        .select('id')
        .or(`emergency_contact.eq.${cleanPhone},emergency_contact.eq.${cleanPhone.replace('+91', '')}`)
        .single()

      if (patientDetail && !lookupError) {
        userId = patientDetail.id
        userFound = true
        console.log(`[OTP Verification] User found in patient_details: ${userId}`)
      }
    }

    // Strategy 3: If still not found, use the verify-users-exist function with a dummy email
    // This is a fallback when we don't have phone number in our records
    if (!userFound) {
      console.log(`[OTP Verification] User not found with any strategy, this will require email confirmation`)
      
      // Mark OTP as used but don't set user_id since we need email confirmation
      const { error: updateError } = await supabase
        .from('password_reset_otps')
        .update({ used: true })
        .eq('id', otpRecord.id)

      if (updateError) {
        console.error('Error marking OTP as used:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to verify OTP' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Return response indicating email confirmation is needed
      return new Response(
        JSON.stringify({ 
          error: 'No account found with this phone number. Please enter your email address to link your phone number to your account.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark OTP as used and update with user_id
    const { error: updateError } = await supabase
      .from('password_reset_otps')
      .update({ 
        used: true,
        user_id: userId
      })
      .eq('id', otpRecord.id)

    if (updateError) {
      console.error('Error marking OTP as used:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate a temporary session token for password reset
    const sessionToken = encode(JSON.stringify({
      userId: userId,
      phoneNumber: cleanPhone,
      timestamp: Date.now(),
      purpose: 'password_reset'
    }))

    console.log(`[OTP Verification] OTP verified successfully for user: ${userId}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP verified successfully',
        sessionToken
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in verify-password-reset-otp:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
