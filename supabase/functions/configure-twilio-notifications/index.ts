
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check all required Twilio environment variables
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

    console.log("=== TWILIO CONFIGURATION CHECK ===");
    console.log("TWILIO_ACCOUNT_SID:", twilioAccountSid ? "Present" : "Missing");
    console.log("TWILIO_AUTH_TOKEN:", twilioAuthToken ? "Present" : "Missing");
    console.log("TWILIO_PHONE_NUMBER:", twilioPhoneNumber ? "Present" : "Missing");
    console.log("TWILIO_WHATSAPP_NUMBER:", twilioWhatsAppNumber ? "Present" : "Missing");

    const missingSecrets = [];
    const presentSecrets = [];

    if (!twilioAccountSid) missingSecrets.push('TWILIO_ACCOUNT_SID');
    else presentSecrets.push('TWILIO_ACCOUNT_SID');

    if (!twilioAuthToken) missingSecrets.push('TWILIO_AUTH_TOKEN');
    else presentSecrets.push('TWILIO_AUTH_TOKEN');

    if (!twilioPhoneNumber) missingSecrets.push('TWILIO_PHONE_NUMBER');
    else presentSecrets.push('TWILIO_PHONE_NUMBER');

    if (!twilioWhatsAppNumber) missingSecrets.push('TWILIO_WHATSAPP_NUMBER');
    else presentSecrets.push('TWILIO_WHATSAPP_NUMBER');

    const configurationStatus = {
      allConfigured: missingSecrets.length === 0,
      presentSecrets,
      missingSecrets,
      totalRequired: 4,
      totalConfigured: presentSecrets.length
    };

    console.log("Configuration status:", configurationStatus);

    if (missingSecrets.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        configured: false,
        message: `Twilio configuration incomplete. Missing: ${missingSecrets.join(', ')}`,
        details: configurationStatus,
        instructions: {
          message: "Please configure the missing Twilio secrets in your Supabase project settings",
          missingSecrets: missingSecrets,
          setupGuide: [
            "1. Go to your Supabase project dashboard",
            "2. Navigate to Settings > API",
            "3. Scroll down to 'Project API Keys' section",
            "4. Add the missing environment variables as secrets",
            "5. Ensure the variable names match exactly as listed above"
          ]
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      configured: true,
      message: "All Twilio environment variables are properly configured",
      details: configurationStatus,
      nextSteps: [
        "SMS notifications will work with TWILIO_PHONE_NUMBER",
        "WhatsApp notifications will work with TWILIO_WHATSAPP_NUMBER", 
        "Test the notification functions to verify functionality"
      ]
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking Twilio configuration:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: "Failed to check Twilio configuration"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
