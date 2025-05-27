
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  email: string;
  otp: string;
  newPassword: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, otp, newPassword }: RequestBody = await req.json()
    
    console.log(`[Password Update] Starting password update for email: ${email}`)
    
    if (!email || !otp || !newPassword) {
      console.error('[Password Update] Missing required fields')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email, OTP, and new password are required' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    console.log(`[Password Update] Cleaned email: ${cleanEmail}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Password Update] Missing Supabase configuration')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify OTP exists and is valid - FIXED: using otp_code instead of otp
    console.log('[Password Update] Verifying OTP...')
    const { data: otpRecord, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('email', cleanEmail)
      .eq('otp_code', otp)  // FIXED: Changed from 'otp' to 'otp_code'
      .eq('reset_method', 'email')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (otpError || !otpRecord) {
      console.error('[Password Update] OTP validation error:', otpError)
      
      // Check if OTP exists but is expired/used
      const { data: anyOtpRecord } = await supabase
        .from('password_reset_otps')
        .select('*')
        .eq('email', cleanEmail)
        .eq('otp_code', otp)  // FIXED: Changed from 'otp' to 'otp_code'
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

    console.log('[Password Update] OTP is valid, updating password...')

    // Find user by email using RPC function
    let userFound = false

    try {
      const { data: userExists, error: rpcError } = await supabase
        .rpc('check_user_exists', { p_email: cleanEmail });
      
      if (rpcError) {
        console.error('[Password Update] User existence check error:', rpcError);
        throw new Error('Failed to verify user account');
      } else if (userExists) {
        userFound = true
        console.log('[Password Update] User found via email auth check')
      }
    } catch (error) {
      console.error('[Password Update] Email user lookup failed:', error)
      throw new Error('Failed to verify user account');
    }

    // If user not found, return error
    if (!userFound) {
      console.log('[Password Update] No user found for email:', cleanEmail)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `No account found with email address ${email}. Please check your email or create a new account.`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the user's password using Supabase Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      otpRecord.user_id || '', // This might be null, we'll handle it
      { password: newPassword }
    )

    // If user_id is null, try to find and update by email
    if (updateError && updateError.message.includes('User not found')) {
      // Get the user by email first
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        console.error('[Password Update] Error listing users:', listError)
        throw new Error('Failed to update password')
      }

      const user = users.find(u => u.email === cleanEmail)
      if (!user) {
        console.error('[Password Update] User not found in auth.users')
        throw new Error('User account not found')
      }

      // Try updating with the found user ID
      const { error: retryUpdateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      )

      if (retryUpdateError) {
        console.error('[Password Update] Password update failed on retry:', retryUpdateError)
        throw new Error('Failed to update password')
      }
    } else if (updateError) {
      console.error('[Password Update] Password update failed:', updateError)
      throw new Error('Failed to update password')
    }

    // Mark OTP as used
    const { error: markUsedError } = await supabase
      .from('password_reset_otps')
      .update({ used: true })
      .eq('id', otpRecord.id)

    if (markUsedError) {
      console.warn('[Password Update] Warning: Failed to mark OTP as used:', markUsedError)
    }

    console.log(`[Password Update] Password updated successfully for email: ${cleanEmail}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password updated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Password Update] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'An unexpected error occurred while updating password. Please try again.',
        details: error.message 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
