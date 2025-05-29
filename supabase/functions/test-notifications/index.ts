
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { test_type, email, phone } = await req.json();

    console.log(`Testing notification type: ${test_type}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const testResults = {
      environment_check: {},
      notification_result: {}
    };

    // Check environment variables
    testResults.environment_check = {
      RESEND_API_KEY: Deno.env.get('RESEND_API_KEY') ? 'Present' : 'Missing',
      TWILIO_ACCOUNT_SID: Deno.env.get('TWILIO_ACCOUNT_SID') ? 'Present' : 'Missing',
      TWILIO_AUTH_TOKEN: Deno.env.get('TWILIO_AUTH_TOKEN') ? 'Present' : 'Missing',
      TWILIO_PHONE_NUMBER: Deno.env.get('TWILIO_PHONE_NUMBER') ? 'Present' : 'Missing',
      TWILIO_WHATSAPP_NUMBER: Deno.env.get('TWILIO_WHATSAPP_NUMBER') ? 'Present' : 'Missing',
    };

    console.log("Environment check:", testResults.environment_check);

    if (test_type === 'email' && email) {
      console.log("Testing email notification...");
      const { data, error } = await supabaseClient.functions.invoke(
        'send-email-notification',
        {
          body: {
            to: email,
            subject: 'Test Email Notification',
            html: '<h1>Test Email</h1><p>This is a test email from the healthcare platform.</p>',
            text: 'Test Email - This is a test email from the healthcare platform.'
          }
        }
      );
      
      testResults.notification_result = { data, error: error?.message };
    } else if (test_type === 'sms' && phone) {
      console.log("Testing SMS notification...");
      const { data, error } = await supabaseClient.functions.invoke(
        'send-sms-notification',
        {
          body: {
            phone_number: phone,
            message: 'Test SMS from Healthcare Platform - This is a test message.',
            user_id: '00000000-0000-0000-0000-000000000000'
          }
        }
      );
      
      testResults.notification_result = { data, error: error?.message };
    } else if (test_type === 'whatsapp' && phone) {
      console.log("Testing WhatsApp notification...");
      const { data, error } = await supabaseClient.functions.invoke(
        'send-whatsapp-notification',
        {
          body: {
            phone_number: phone,
            message: 'Test WhatsApp from Healthcare Platform - This is a test message.',
            user_id: '00000000-0000-0000-0000-000000000000'
          }
        }
      );
      
      testResults.notification_result = { data, error: error?.message };
    } else {
      throw new Error('Invalid test_type or missing contact information');
    }

    return new Response(
      JSON.stringify({
        success: true,
        test_type,
        results: testResults
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in test-notifications:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
