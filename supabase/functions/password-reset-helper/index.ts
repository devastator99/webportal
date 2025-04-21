
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResetPasswordRequest {
  email: string;
  redirectUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, redirectUrl }: ResetPasswordRequest = await req.json()
    
    if (!email || !redirectUrl) {
      return new Response(
        JSON.stringify({ error: 'Email and redirectUrl are required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      )
    }
    
    console.log(`Sending password reset for email: ${email.substring(0, 4)}*** with redirect URL: ${redirectUrl}`)
    
    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Make sure redirectUrl is the absolute path to /update-password
    // This ensures Supabase redirects to the right page after password reset
    let finalRedirectUrl = redirectUrl;
    
    // Log the URL format we're sending to Supabase
    console.log('Using redirect URL format:', finalRedirectUrl);

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: finalRedirectUrl,
    })

    if (error) {
      console.error('Error sending reset email:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Password reset email sent successfully' }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    )
  } catch (error) {
    console.error('Error in password-reset-helper:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    )
  }
})
