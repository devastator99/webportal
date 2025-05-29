
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
    const {
      patient_id,
      patient_email,
      patient_phone,
      patient_name,
      doctor_name,
      nutritionist_name,
      patient_details
    } = await req.json();

    console.log(`Sending comprehensive welcome notification for patient: ${patient_name} (${patient_id})`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Prepare welcome message content
    const welcomeMessage = `
🎉 Welcome to our Healthcare Platform, ${patient_name}!

Your registration is now complete and your care team has been assigned:

👨‍⚕️ Doctor: ${doctor_name}
🥗 Nutritionist: ${nutritionist_name}

What's next?
✅ Your care team chat room has been created
✅ You can now access your personalized health dashboard
✅ Start tracking your health habits and goals
✅ Schedule appointments with your care team

We're excited to support you on your health journey!

Best regards,
Your Healthcare Team
    `.trim();

    const results = {};

    // Send email notification using Resend
    if (patient_email) {
      try {
        const { data: emailResult, error: emailError } = await supabaseClient.functions.invoke(
          'send-email-notification',
          {
            body: {
              to: patient_email,
              subject: `Welcome ${patient_name}! Your care team is ready`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #7E69AB;">🎉 Welcome to our Healthcare Platform!</h1>
                  <p>Dear ${patient_name},</p>
                  <p>Your registration is now complete and your care team has been assigned:</p>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>👨‍⚕️ Doctor:</strong> ${doctor_name}</p>
                    <p><strong>🥗 Nutritionist:</strong> ${nutritionist_name}</p>
                  </div>
                  <h3>What's next?</h3>
                  <ul>
                    <li>✅ Your care team chat room has been created</li>
                    <li>✅ You can now access your personalized health dashboard</li>
                    <li>✅ Start tracking your health habits and goals</li>
                    <li>✅ Schedule appointments with your care team</li>
                  </ul>
                  <p>We're excited to support you on your health journey!</p>
                  <p>Best regards,<br>Your Healthcare Team</p>
                </div>
              `
            }
          }
        );

        if (emailError) {
          console.error("Email notification error:", emailError);
          results.email = { success: false, error: emailError.message };
        } else {
          console.log("Email notification sent successfully");
          results.email = { success: true, result: emailResult };
        }
      } catch (error) {
        console.error("Email notification exception:", error);
        results.email = { success: false, error: error.message };
      }
    }

    // Send SMS notification using Twilio
    if (patient_phone) {
      try {
        const { data: smsResult, error: smsError } = await supabaseClient.functions.invoke(
          'send-sms-notification',
          {
            body: {
              phone_number: patient_phone,
              message: welcomeMessage,
              user_id: patient_id
            }
          }
        );

        if (smsError) {
          console.error("SMS notification error:", smsError);
          results.sms = { success: false, error: smsError.message };
        } else {
          console.log("SMS notification sent successfully");
          results.sms = { success: true, result: smsResult };
        }
      } catch (error) {
        console.error("SMS notification exception:", error);
        results.sms = { success: false, error: error.message };
      }
    }

    // Send WhatsApp notification using Twilio
    if (patient_phone) {
      try {
        const { data: whatsappResult, error: whatsappError } = await supabaseClient.functions.invoke(
          'send-whatsapp-notification',
          {
            body: {
              phone_number: patient_phone,
              message: welcomeMessage,
              user_id: patient_id
            }
          }
        );

        if (whatsappError) {
          console.error("WhatsApp notification error:", whatsappError);
          results.whatsapp = { success: false, error: whatsappError.message };
        } else {
          console.log("WhatsApp notification sent successfully");
          results.whatsapp = { success: true, result: whatsappResult };
        }
      } catch (error) {
        console.error("WhatsApp notification exception:", error);
        results.whatsapp = { success: false, error: error.message };
      }
    }

    // Log the welcome notification in the database with correct enum value
    try {
      const { error: logError } = await supabaseClient
        .from('notification_logs')
        .insert({
          user_id: patient_id,
          type: 'general', // Use 'general' instead of 'welcome' to match enum
          title: `Welcome ${patient_name}!`,
          body: welcomeMessage,
          status: 'sent',
          data: {
            doctor_name,
            nutritionist_name,
            notifications_sent: results
          }
        });

      if (logError) {
        console.error("Error logging notification:", logError);
      }
    } catch (error) {
      console.error("Notification logging exception:", error);
    }

    console.log(`Comprehensive welcome notification completed for ${patient_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Comprehensive welcome notification sent",
        patient_id,
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-comprehensive-welcome-notification:', error);
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
