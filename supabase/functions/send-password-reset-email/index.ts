
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetEmailRequest {
  email: string;
  resetUrl: string;
}

// Generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { email, resetUrl } = await req.json() as ResetEmailRequest;
    
    if (!email) {
      console.error("Missing email in request");
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase URL or service role key");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Attempting to send password reset OTP to: ${email}`);
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate a 6-digit OTP
    const otp = generateOTP();
    
    // Store the OTP in the database temporarily (1 hour expiry)
    const { error: storeError } = await supabase
      .from('password_reset_otps')
      .upsert({ 
        email, 
        otp, 
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour expiry
      });
      
    if (storeError) {
      console.error("Error storing OTP:", storeError);
      return new Response(
        JSON.stringify({ success: false, error: storeError.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Send email directly with OTP - this is the critical change
    const { error: emailError } = await supabase.auth.admin.sendEmail(
      email,
      'PASSWORD_RECOVERY', // Using standard email type
      { 
        subject: 'Your password reset OTP', 
        body: `Your OTP for password reset is: ${otp}\nThis code will expire in 1 hour.`,
        data: {
          otp: otp,
          password_reset: true
        }
      }
    );
    
    if (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ success: false, error: emailError.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Password reset OTP sent successfully");
    
    return new Response(
      JSON.stringify({ success: true, message: "Password reset OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Password reset email error:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to send password reset OTP" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
