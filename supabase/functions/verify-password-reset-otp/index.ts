
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

    // Now look up the user by phone number in patient_details
    const { data: patientDetail, error: lookupError } = await supabase
      .from('patient_details')
      .select('id')
      .or(`emergency_contact.eq.${cleanPhone},emergency_contact.eq.${cleanPhone.replace('+91', '')}`)
      .single()

    if (lookupError || !patientDetail) {
      console.error(`No patient found with phone ${cleanPhone}:`, lookupError)
      return new Response(
        JSON.stringify({ error: 'No account found with this phone number' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = patientDetail.id

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
