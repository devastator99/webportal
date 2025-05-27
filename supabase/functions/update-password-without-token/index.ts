
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

    // Find user by email using RPC function first
    let userFound = false
    try {
      const { data: userExists, error: rpcError } = await supabase
        .rpc('check_user_exists', { p_email: userEmail });
      
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
      console.log('[Password Update] No user found for email:', userEmail)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `No account found with email address ${userEmail}. Please check your email or create a new account.`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the user by email using a direct query to auth.users
    console.log('[Password Update] Finding user by email for password update...')
    const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(
      // We need to get the user ID first by querying the auth.users table directly via RPC
      await (async () => {
        try {
          // Create a simple query to get user ID by email
          const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1)
            .single()
          
          if (error) {
            // Try a different approach using a custom RPC
            const { data: userData, error: userError } = await supabase.rpc('get_user_id_by_email', { 
              user_email: userEmail 
            })
            
            if (userError || !userData) {
              throw new Error('User not found')
            }
            return userData
          }
          
          return data?.id
        } catch (e) {
          // Fallback: Use Supabase admin to find user
          const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1000
          })
          
          if (listError) {
            throw new Error('Failed to find user')
          }
          
          const user = users.find(u => u.email === userEmail)
          if (!user) {
            throw new Error('User not found')
          }
          
          return user.id
        }
      })()
    )

    if (getUserError) {
      console.error('[Password Update] Error getting user by ID:', getUserError)
      throw new Error('Failed to find user account')
    }

    if (!authUser?.user) {
      console.error('[Password Update] User not found in auth system')
      throw new Error('User account not found')
    }

    // Update the user's password using Supabase Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('[Password Update] Password update failed:', updateError)
      throw new Error('Failed to update password')
    }

    console.log(`[Password Update] Password updated successfully for email: ${userEmail}`)
    
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
