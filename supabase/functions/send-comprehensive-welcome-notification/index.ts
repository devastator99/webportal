
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

    const notifications = [];

    // Send WhatsApp notification if phone number is available
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
          notifications.push({ type: 'whatsapp', success: false, error: whatsappError.message });
        } else {
          console.log("WhatsApp notification sent successfully");
          notifications.push({ type: 'whatsapp', success: true, result: whatsappResult });
        }
      } catch (error) {
        console.error("WhatsApp notification exception:", error);
        notifications.push({ type: 'whatsapp', success: false, error: error.message });
      }
    }

    // Send email notification if email is available
    if (patient_email) {
      try {
        // For now, we'll log the email content since we don't have an email service configured
        console.log(`Email notification would be sent to: ${patient_email}`);
        console.log(`Email content: ${welcomeMessage}`);
        
        notifications.push({ 
          type: 'email', 
          success: true, 
          message: 'Email notification logged (service not configured)' 
        });
      } catch (error) {
        console.error("Email notification exception:", error);
        notifications.push({ type: 'email', success: false, error: error.message });
      }
    }

    // Send push notification if user has subscriptions
    try {
      const { data: pushResult, error: pushError } = await supabaseClient.functions.invoke(
        'send-push-notification',
        {
          body: {
            user_id: patient_id,
            title: `Welcome ${patient_name}!`,
            body: 'Your registration is complete. Your care team is ready to support you!',
            data: {
              type: 'welcome',
              patient_id: patient_id
            }
          }
        }
      );

      if (pushError) {
        console.error("Push notification error:", pushError);
        notifications.push({ type: 'push', success: false, error: pushError.message });
      } else {
        console.log("Push notification sent successfully");
        notifications.push({ type: 'push', success: true, result: pushResult });
      }
    } catch (error) {
      console.error("Push notification exception:", error);
      notifications.push({ type: 'push', success: false, error: error.message });
    }

    // Log the welcome notification in the database
    try {
      const { error: logError } = await supabaseClient
        .from('notification_logs')
        .insert({
          user_id: patient_id,
          type: 'welcome',
          title: `Welcome ${patient_name}!`,
          body: welcomeMessage,
          status: 'sent',
          data: {
            doctor_name,
            nutritionist_name,
            notifications_sent: notifications
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
        notifications_sent: notifications.length,
        notifications
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
