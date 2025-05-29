
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
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    console.log("Environment variables check:");
    console.log("TWILIO_ACCOUNT_SID:", twilioAccountSid ? "Present" : "Missing");
    console.log("TWILIO_AUTH_TOKEN:", twilioAuthToken ? "Present" : "Missing");
    console.log("TWILIO_PHONE_NUMBER:", twilioPhoneNumber ? "Present" : "Missing");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      const missingVars = [];
      if (!twilioAccountSid) missingVars.push('TWILIO_ACCOUNT_SID');
      if (!twilioAuthToken) missingVars.push('TWILIO_AUTH_TOKEN');
      if (!twilioPhoneNumber) missingVars.push('TWILIO_PHONE_NUMBER');
      
      throw new Error(`Twilio credentials not configured. Missing: ${missingVars.join(', ')}`);
    }

    const { phone_number, message, user_id } = await req.json();

    if (!phone_number || !message) {
      throw new Error('Missing required fields: phone_number, message');
    }

    console.log(`Sending SMS to: ${phone_number}`);
    console.log(`Message length: ${message.length} characters`);

    // Format phone number to ensure it starts with +
    const formattedPhoneNumber = phone_number.startsWith('+') ? phone_number : `+91${phone_number}`;
    console.log(`Formatted phone number: ${formattedPhoneNumber}`);

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const body = new URLSearchParams({
      From: twilioPhoneNumber,
      To: formattedPhoneNumber,
      Body: message
    });

    console.log("Twilio request body:", body.toString());

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const result = await response.json();

    console.log("Twilio API response status:", response.status);
    console.log("Twilio API response:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('Twilio SMS error:', result);
      throw new Error(`Twilio error (${response.status}): ${result.message || 'Unknown error'}`);
    }

    console.log('SMS sent successfully:', result.sid);

    return new Response(JSON.stringify({
      success: true,
      message_sid: result.sid,
      status: result.status
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
