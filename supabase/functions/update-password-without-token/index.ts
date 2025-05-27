
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode } from "https://deno.land/std@0.82.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  sessionToken?: string;
  email?: string;
  otp?: string;
  newPassword: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionToken, email, otp, newPassword }: RequestBody = await req.json()
    
    console.log(`[Password Update] Starting password update with ${sessionToken ? 'session token' : 'email/OTP'}`)
    
    if (!newPassword) {
      console.error('[Password Update] Missing new password')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'New password is required' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    let userEmail: string

    // Handle session token approach (preferred)
    if (sessionToken) {
      console.log('[Password Update] Using session token approach')
      try {
        const sessionData = JSON.parse(new TextDecoder().decode(decode(sessionToken)))
        
        if (!sessionData.email || sessionData.purpose !== 'password_reset') {
          throw new Error('Invalid session token')
        }
        
        // Check if token is not too old (1 hour max)
        const tokenAge = Date.now() - sessionData.timestamp
        if (tokenAge > 3600000) { // 1 hour
          throw new Error('Session token has expired')
        }
        
        userEmail = sessionData.email
        console.log(`[Password Update] Session token validated for email: ${userEmail}`)
        
      } catch (error) {
        console.error('[Password Update] Session token validation failed:', error)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid or expired session token. Please start the password reset process again.' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } 
    // Fallback to OTP approach (legacy)
    else if (email && otp) {
      console.log('[Password Update] Using legacy OTP approach')
      userEmail = email.toLowerCase().trim()
      
      // Verify OTP exists and is valid
      console.log('[Password Update] Verifying OTP...')
      const { data: otpRecord, error: otpError } = await supabase
        .from('password_reset_otps')
        .select('*')
        .eq('email', userEmail)
        .eq('otp_code', otp)
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
          .eq('email', userEmail)
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

      // Mark OTP as used immediately to prevent reuse
      const { error: markUsedError } = await supabase
        .from('password_reset_otps')
        .update({ used: true })
        .eq('id', otpRecord.id)

      if (markUsedError) {
        console.warn('[Password Update] Warning: Failed to mark OTP as used:', markUsedError)
      }
    } else {
      console.error('[Password Update] Missing required authentication data')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Session token or email/OTP is required' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[Password Update] Updating password for email:', userEmail)

    // Find user by email using RPC function
    let userId: string | null = null
    try {
      const { data: foundUserId, error: rpcError } = await supabase
        .rpc('get_user_id_by_email', { user_email: userEmail });
      
      if (rpcError) {
        console.error('[Password Update] User ID lookup error:', rpcError);
        throw new Error('Failed to find user account');
      } 
      
      if (foundUserId) {
        userId = foundUserId
        console.log('[Password Update] User ID found via RPC:', userId)
      } else {
        console.log('[Password Update] No user found for email:', userEmail)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `No account found with email address ${userEmail}. Please check your email or create a new account.`
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (error) {
      console.error('[Password Update] Email user lookup failed:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to verify user account' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the user's password using Supabase Admin API with email instead of user ID
    console.log('[Password Update] Updating password for user email:', userEmail)
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('[Password Update] Password update failed:', updateError)
      
      // Try alternative approach using email if user ID approach fails
      console.log('[Password Update] Trying alternative approach with email...')
      try {
        // First get the user by email
        const { data: userData, error: emailError } = await supabase.auth.admin.listUsers()
        
        if (emailError) {
          throw emailError
        }
        
        const user = userData.users.find(u => u.email === userEmail)
        if (!user) {
          throw new Error('User not found by email')
        }
        
        // Update password using the found user's ID
        const { error: altUpdateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { password: newPassword }
        )
        
        if (altUpdateError) {
          throw altUpdateError
        }
        
        console.log('[Password Update] Password updated successfully using alternative approach')
        
      } catch (altError) {
        console.error('[Password Update] Alternative approach also failed:', altError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to update password. Please try again.' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      console.log(`[Password Update] Password updated successfully for email: ${userEmail}`)
    }
    
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
