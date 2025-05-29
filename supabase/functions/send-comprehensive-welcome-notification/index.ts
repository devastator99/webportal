
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

    console.log(`Starting comprehensive welcome notification for patient: ${patient_name} (${patient_id})`);
    console.log(`Email: ${patient_email}, Phone: ${patient_phone}`);

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

    const results = {
      email: { success: false, attempted: false },
      sms: { success: false, attempted: false },
      whatsapp: { success: false, attempted: false }
    };

    // Send email notification using Resend
    if (patient_email) {
      results.email.attempted = true;
      try {
        console.log("Attempting to send email notification...");
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
              `,
              text: welcomeMessage
            }
          }
        );

        if (emailError) {
          console.error("Email notification error:", emailError);
          results.email = { success: false, attempted: true, error: emailError.message };
        } else if (emailResult && emailResult.success) {
          console.log("Email notification sent successfully");
          results.email = { success: true, attempted: true, result: emailResult };
        } else {
          console.error("Email notification failed:", emailResult);
          results.email = { success: false, attempted: true, error: "Unknown email error" };
        }
      } catch (error) {
        console.error("Email notification exception:", error);
        results.email = { success: false, attempted: true, error: error.message };
      }
    } else {
      console.log("No email provided, skipping email notification");
    }

    // Send SMS notification using Twilio
    if (patient_phone) {
      results.sms.attempted = true;
      try {
        console.log("Attempting to send SMS notification...");
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
          results.sms = { success: false, attempted: true, error: smsError.message };
        } else if (smsResult && smsResult.success) {
          console.log("SMS notification sent successfully");
          results.sms = { success: true, attempted: true, result: smsResult };
        } else {
          console.error("SMS notification failed:", smsResult);
          results.sms = { success: false, attempted: true, error: "Unknown SMS error" };
        }
      } catch (error) {
        console.error("SMS notification exception:", error);
        results.sms = { success: false, attempted: true, error: error.message };
      }
    } else {
      console.log("No phone provided, skipping SMS notification");
    }

    // Send WhatsApp notification using Twilio
    if (patient_phone) {
      results.whatsapp.attempted = true;
      try {
        console.log("Attempting to send WhatsApp notification...");
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
          results.whatsapp = { success: false, attempted: true, error: whatsappError.message };
        } else if (whatsappResult && whatsappResult.success) {
          console.log("WhatsApp notification sent successfully");
          results.whatsapp = { success: true, attempted: true, result: whatsappResult };
        } else {
          console.error("WhatsApp notification failed:", whatsappResult);
          results.whatsapp = { success: false, attempted: true, error: "Unknown WhatsApp error" };
        }
      } catch (error) {
        console.error("WhatsApp notification exception:", error);
        results.whatsapp = { success: false, attempted: true, error: error.message };
      }
    } else {
      console.log("No phone provided, skipping WhatsApp notification");
    }

    // Log the welcome notification in the database
    try {
      const { error: logError } = await supabaseClient
        .from('notification_logs')
        .insert({
          user_id: patient_id,
          type: 'general',
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
      } else {
        console.log("Notification logged successfully");
      }
    } catch (error) {
      console.error("Notification logging exception:", error);
    }

    // Determine overall success
    const successfulNotifications = Object.values(results).filter(r => r.success).length;
    const attemptedNotifications = Object.values(results).filter(r => r.attempted).length;
    
    console.log(`Comprehensive welcome notification completed for ${patient_name}`);
    console.log(`Success rate: ${successfulNotifications}/${attemptedNotifications} notifications sent`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Comprehensive welcome notification process completed",
        patient_id,
        results,
        summary: {
          attempted: attemptedNotifications,
          successful: successfulNotifications,
          success_rate: attemptedNotifications > 0 ? (successfulNotifications / attemptedNotifications * 100).toFixed(1) + '%' : '0%'
        }
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
