
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

    console.log(`=== TESTING NOTIFICATION: ${test_type.toUpperCase()} ===`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const testResults = {
      environment_check: {},
      notification_result: {},
      timestamp: new Date().toISOString()
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
            subject: 'Test Email Notification - Healthcare Platform',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #9b87f5;">Test Email Notification</h1>
                <p>This is a test email from the Healthcare Platform notification system.</p>
                <p><strong>Test Details:</strong></p>
                <ul>
                  <li>Timestamp: ${new Date().toISOString()}</li>
                  <li>Function: send-email-notification</li>
                  <li>Status: Successfully sent</li>
                </ul>
                <p>If you received this email, your email notification system is working correctly!</p>
              </div>
            `,
            text: 'Test Email Notification - Healthcare Platform. This is a test email from the notification system. If you received this, your email notifications are working correctly!'
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
            message: 'Test SMS from Healthcare Platform - Your SMS notification system is working correctly! 🏥✅',
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
            message: 'Test WhatsApp message from Healthcare Platform - Your WhatsApp notification system is working correctly! 🏥💬✅',
            user_id: '00000000-0000-0000-0000-000000000000'
          }
        }
      );
      
      testResults.notification_result = { data, error: error?.message };
    } else if (test_type === 'all') {
      console.log("Testing all notification types...");
      
      // Test email
      if (email) {
        const { data: emailData, error: emailError } = await supabaseClient.functions.invoke(
          'send-email-notification',
          {
            body: {
              to: email,
              subject: 'Complete Test - Healthcare Platform',
              html: '<h1>Complete Notification Test</h1><p>Email notifications are working!</p>',
              text: 'Complete Notification Test - Email notifications are working!'
            }
          }
        );
        testResults.notification_result.email = { data: emailData, error: emailError?.message };
      }
      
      // Test SMS
      if (phone) {
        const { data: smsData, error: smsError } = await supabaseClient.functions.invoke(
          'send-sms-notification',
          {
            body: {
              phone_number: phone,
              message: 'Complete Test SMS - Healthcare Platform notifications working! 🏥📱',
              user_id: '00000000-0000-0000-0000-000000000000'
            }
          }
        );
        testResults.notification_result.sms = { data: smsData, error: smsError?.message };
      }
      
      // Test WhatsApp
      if (phone) {
        const { data: whatsappData, error: whatsappError } = await supabaseClient.functions.invoke(
          'send-whatsapp-notification',
          {
            body: {
              phone_number: phone,
              message: 'Complete Test WhatsApp - Healthcare Platform notifications working! 🏥💬',
              user_id: '00000000-0000-0000-0000-000000000000'
            }
          }
        );
        testResults.notification_result.whatsapp = { data: whatsappData, error: whatsappError?.message };
      }
    } else {
      throw new Error('Invalid test_type or missing contact information');
    }

    console.log("Test completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        test_type,
        results: testResults,
        message: `${test_type} notification test completed`
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
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
