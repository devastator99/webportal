
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "npm:resend@2.0.0";

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
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY environment variable");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Attempting to send password reset OTP to: ${email}`);
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate a 6-digit OTP
    const otp = generateOTP();
    
    // Clean up any existing email OTPs for this email address
    const { error: deleteError } = await supabase
      .from('password_reset_otps')
      .delete()
      .eq('email', email.toLowerCase().trim())
      .eq('reset_method', 'email');
      
    if (deleteError) {
      console.warn("Warning during email OTP cleanup:", deleteError);
    }
    
    // Store the OTP in the database (1 hour expiry)
    const { error: storeError } = await supabase
      .from('password_reset_otps')
      .insert({ 
        email: email.toLowerCase().trim(),
        otp_code: otp,
        reset_method: 'email',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour expiry
        used: false,
        user_id: null
      });
      
    if (storeError) {
      console.error("Error storing OTP:", storeError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to process request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Initialize Resend
    const resend = new Resend(resendApiKey);
    
    // Send email using Resend with the proper default domain
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "onboarding@resend.dev", // Use only the email address without display name
      to: [email],
      subject: "Password Reset Code - Healthcare App",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0;">Password Reset Request</h1>
          </div>
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 20px 0;">
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
              You have requested to reset your password for your Healthcare App account.
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
              Your verification code is:
            </p>
            
            <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0;">
              This code will expire in 1 hour for security reasons.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
              If you didn't request this password reset, please ignore this email. Your account remains secure.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Best regards,<br/>
              Healthcare App Team
            </p>
          </div>
        </div>
      `,
    });
    
    if (emailError) {
      console.error("Error sending email:", emailError);
      
      // Check for specific domain verification errors
      if (emailError.message && emailError.message.includes('domain is not verified')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Email service configuration issue. Please contact support.",
            details: "Domain verification required"
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Password reset OTP sent successfully:", emailData);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset code sent successfully",
        messageId: emailData?.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Password reset email error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Failed to send password reset email. Please try again." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
