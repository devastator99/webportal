
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
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

    console.log("WhatsApp environment variables check:");
    console.log("TWILIO_ACCOUNT_SID:", twilioAccountSid ? "Present" : "Missing");
    console.log("TWILIO_AUTH_TOKEN:", twilioAuthToken ? "Present" : "Missing");
    console.log("TWILIO_WHATSAPP_NUMBER:", twilioWhatsAppNumber ? "Present" : "Missing");

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      const missingVars = [];
      if (!twilioAccountSid) missingVars.push('TWILIO_ACCOUNT_SID');
      if (!twilioAuthToken) missingVars.push('TWILIO_AUTH_TOKEN');
      if (!twilioWhatsAppNumber) missingVars.push('TWILIO_WHATSAPP_NUMBER');
      
      throw new Error(`Twilio WhatsApp credentials not configured. Missing: ${missingVars.join(', ')}`);
    }

    const { phone_number, message, user_id } = await req.json();

    if (!phone_number || !message) {
      throw new Error('Missing required fields: phone_number, message');
    }

    console.log(`Sending WhatsApp message to: ${phone_number}`);
    console.log(`Message length: ${message.length} characters`);

    // Format phone numbers for WhatsApp
    const fromWhatsApp = `whatsapp:${twilioWhatsAppNumber}`;
    const toWhatsApp = `whatsapp:${phone_number.startsWith('+') ? phone_number : `+91${phone_number}`}`;
    
    console.log(`From WhatsApp: ${fromWhatsApp}`);
    console.log(`To WhatsApp: ${toWhatsApp}`);

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const body = new URLSearchParams({
      From: fromWhatsApp,
      To: toWhatsApp,
      Body: message
    });

    console.log("WhatsApp request body:", body.toString());

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const result = await response.json();

    console.log("Twilio WhatsApp API response status:", response.status);
    console.log("Twilio WhatsApp API response:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('Twilio WhatsApp error:', result);
      throw new Error(`Twilio WhatsApp error (${response.status}): ${result.message || 'Unknown error'}`);
    }

    console.log('WhatsApp message sent successfully:', result.sid);

    return new Response(JSON.stringify({
      success: true,
      message_sid: result.sid,
      status: result.status
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
