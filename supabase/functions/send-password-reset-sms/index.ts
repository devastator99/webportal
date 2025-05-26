
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  phoneNumber: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phoneNumber }: RequestBody = await req.json()
    
    console.log(`[SMS OTP] Request received for phone: ${phoneNumber}`)
    
    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Basic phone number validation
    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`
    
    // Validate phone number format
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      console.error(`[SMS OTP] Invalid phone number format: ${cleanPhone}`)
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get Twilio credentials from Supabase secrets
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    
    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('Twilio credentials not configured')
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`[SMS OTP] Generated OTP for phone: ${cleanPhone}`)

    // Store OTP - First delete any existing OTPs for this phone, then insert new one
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    try {
      // Delete any existing OTPs for this phone number (cleanup)
      const { error: deleteError } = await supabase
        .from('password_reset_otps')
        .delete()
        .eq('phone_number', cleanPhone)

      if (deleteError) {
        console.warn(`[SMS OTP] Warning during cleanup: ${deleteError.message}`)
      }

      // Insert new OTP record
      const { error: insertError } = await supabase
        .from('password_reset_otps')
        .insert({
          phone_number: cleanPhone,
          otp_code: otp,
          expires_at: expiresAt,
          used: false,
          user_id: null // Will be set during verification when we match the phone to a user
        })

      if (insertError) {
        console.error('[SMS OTP] Error storing OTP:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to generate OTP', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`[SMS OTP] OTP stored successfully, sending SMS to ${cleanPhone}`)

    } catch (dbError) {
      console.error('[SMS OTP] Database operation failed:', dbError)
      return new Response(
        JSON.stringify({ error: 'Database operation failed', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)
    
    const formData = new URLSearchParams()
    formData.append('To', cleanPhone)
    formData.append('From', '+16508648816') // Updated Twilio phone number
    formData.append('Body', `Your password reset code is: ${otp}. This code expires in 5 minutes.`)

    try {
      const twilioResponse = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      })

      if (!twilioResponse.ok) {
        const twilioError = await twilioResponse.text()
        console.error('Twilio error:', twilioError)
        return new Response(
          JSON.stringify({ error: 'Failed to send SMS', details: twilioError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`[SMS OTP] SMS sent successfully to ${cleanPhone}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent successfully',
          expiresIn: 300 // 5 minutes
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (twilioError) {
      console.error('[SMS OTP] Twilio request failed:', twilioError)
      return new Response(
        JSON.stringify({ error: 'Failed to send SMS', details: twilioError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error in send-password-reset-sms:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
