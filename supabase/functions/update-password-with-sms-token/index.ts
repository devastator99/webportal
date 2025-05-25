
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode } from "https://deno.land/std@0.82.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  sessionToken: string;
  newPassword: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionToken, newPassword }: RequestBody = await req.json()
    
    if (!sessionToken || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Session token and new password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Decode and validate session token
    let tokenData
    try {
      const decodedBytes = decode(sessionToken)
      const decodedString = new TextDecoder().decode(decodedBytes)
      tokenData = JSON.parse(decodedString)
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid session token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate token data
    if (!tokenData.userId || !tokenData.phoneNumber || !tokenData.timestamp || tokenData.purpose !== 'password_reset') {
      return new Response(
        JSON.stringify({ error: 'Invalid session token format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token is not expired (valid for 10 minutes)
    const tokenAge = Date.now() - tokenData.timestamp
    if (tokenAge > 10 * 60 * 1000) {
      return new Response(
        JSON.stringify({ error: 'Session token expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.userId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update password' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean up any remaining OTP records for this phone number
    await supabase
      .from('password_reset_otps')
      .delete()
      .eq('phone_number', tokenData.phoneNumber)

    console.log(`Password updated for user ${tokenData.userId}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password updated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in update-password-with-sms-token:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
