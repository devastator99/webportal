
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  patient_id: string;
  patient_email: string;
  patient_phone?: string;
  patient_name: string;
  doctor_name?: string;
  nutritionist_name?: string;
  patient_details?: any;
}

// Independent email notification function
async function sendEmailNotification(supabaseClient: any, data: NotificationRequest): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    console.log(`Sending email notification to: ${data.patient_email}`);
    
    const emailSubject = `Welcome to AnubhootiHealth, ${data.patient_name}!`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to AnubhootiHealth</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #9b87f5, #7E69AB); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .highlight { background: #E5DEFF; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .care-team { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #9b87f5; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #9b87f5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to AnubhootiHealth!</h1>
          <p>Your journey to better health starts now</p>
        </div>
        
        <div class="content">
          <h2>Hello ${data.patient_name},</h2>
          
          <p>Congratulations! Your registration is complete and your personalized care team has been assigned. We're excited to be part of your health journey.</p>
          
          <div class="highlight">
            <h3>✅ Your Account is Ready!</h3>
            <p>You can now access all features of the AnubhootiHealth platform:</p>
            <ul>
              <li>📱 Secure messaging with your care team</li>
              <li>📋 Digital health records management</li>
              <li>💊 Prescription tracking</li>
              <li>📊 Personalized health dashboard</li>
              <li>🎯 Custom health plans and goals</li>
            </ul>
          </div>
          
          ${data.doctor_name || data.nutritionist_name ? `
          <div class="care-team">
            <h3>👥 Your Dedicated Care Team</h3>
            ${data.doctor_name ? `<p><strong>Doctor:</strong> ${data.doctor_name}</p>` : ''}
            ${data.nutritionist_name ? `<p><strong>Nutritionist:</strong> ${data.nutritionist_name}</p>` : ''}
            <p>Your care team is here to support you every step of the way. They will be in touch with you soon to discuss your personalized health plan.</p>
          </div>
          ` : ''}
          
          <div class="highlight">
            <h3>🚀 Next Steps</h3>
            <ol>
              <li>Log into your dashboard to explore your new account</li>
              <li>Complete your health profile for personalized recommendations</li>
              <li>Check your messages - your care team may have already sent you a welcome message</li>
              <li>Set up your notification preferences</li>
            </ol>
          </div>
          
          <p>If you have any questions or need assistance, don't hesitate to reach out to your care team through the platform's secure messaging system.</p>
          
          <p>Welcome aboard!</p>
          
          <div class="footer">
            <p><strong>The AnubhootiHealth Team</strong></p>
            <p>🌟 Empowering your health journey with personalized care</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
      Welcome to AnubhootiHealth, ${data.patient_name}!
      
      Congratulations! Your registration is complete and your personalized care team has been assigned.
      
      Your Account is Ready!
      You can now access:
      - Secure messaging with your care team
      - Digital health records management
      - Prescription tracking
      - Personalized health dashboard
      - Custom health plans and goals
      
      ${data.doctor_name ? `Your Doctor: ${data.doctor_name}` : ''}
      ${data.nutritionist_name ? `Your Nutritionist: ${data.nutritionist_name}` : ''}
      
      Next Steps:
      1. Log into your dashboard to explore your new account
      2. Complete your health profile for personalized recommendations
      3. Check your messages from your care team
      4. Set up your notification preferences
      
      Welcome aboard!
      The AnubhootiHealth Team
    `;

    const { data: emailResult, error: emailError } = await supabaseClient.functions.invoke('send-email-notification', {
      body: {
        to: data.patient_email,
        subject: emailSubject,
        html: emailHtml,
        text: emailText
      }
    });

    if (emailError) {
      console.error("Email notification error:", emailError);
      return { success: false, error: emailError.message };
    }

    console.log("Email notification sent successfully:", emailResult);
    return { success: true, result: emailResult };

  } catch (error: any) {
    console.error("Exception in email notification:", error);
    return { success: false, error: error.message };
  }
}

// Independent SMS notification function (optional, will not affect email)
async function sendSmsNotification(supabaseClient: any, data: NotificationRequest): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    if (!data.patient_phone) {
      console.log("No phone number provided, skipping SMS");
      return { success: false, error: "No phone number provided" };
    }

    console.log(`Attempting SMS notification to: ${data.patient_phone}`);
    
    const smsMessage = `Welcome to AnubhootiHealth, ${data.patient_name}! Your registration is complete and your care team has been assigned. ${data.doctor_name ? `Doctor: ${data.doctor_name}. ` : ''}${data.nutritionist_name ? `Nutritionist: ${data.nutritionist_name}. ` : ''}Log in to access your personalized health dashboard.`;

    const { data: smsResult, error: smsError } = await supabaseClient.functions.invoke('send-sms-notification', {
      body: {
        to: data.patient_phone,
        message: smsMessage
      }
    });

    if (smsError) {
      console.error("SMS notification error (will not affect email):", smsError);
      return { success: false, error: smsError.message };
    }

    console.log("SMS notification sent successfully:", smsResult);
    return { success: true, result: smsResult };

  } catch (error: any) {
    console.error("Exception in SMS notification (will not affect email):", error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: NotificationRequest = await req.json();
    
    console.log("Processing comprehensive welcome notification for:", requestData.patient_id);

    if (!requestData.patient_id || !requestData.patient_email || !requestData.patient_name) {
      throw new Error("Missing required fields: patient_id, patient_email, or patient_name");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process notifications independently
    const results = {
      email: { success: false, error: "Not attempted" },
      sms: { success: false, error: "Not attempted" }
    };

    // Always attempt email notification (primary method)
    console.log("Attempting email notification...");
    results.email = await sendEmailNotification(supabaseClient, requestData);

    // Attempt SMS notification independently (won't affect email result)
    console.log("Attempting SMS notification...");
    results.sms = await sendSmsNotification(supabaseClient, requestData);

    // Log comprehensive results
    console.log("Notification results:", {
      patient_id: requestData.patient_id,
      email_success: results.email.success,
      sms_success: results.sms.success,
      email_error: results.email.error,
      sms_error: results.sms.error
    });

    // Determine overall success - email is primary, SMS is optional
    const overallSuccess = results.email.success;
    const successfulMethods = [];
    const failedMethods = [];

    if (results.email.success) {
      successfulMethods.push("email");
    } else {
      failedMethods.push(`email: ${results.email.error}`);
    }

    if (results.sms.success) {
      successfulMethods.push("sms");
    } else {
      failedMethods.push(`sms: ${results.sms.error}`);
    }

    const responseMessage = overallSuccess 
      ? `Welcome notifications processed. Successful: [${successfulMethods.join(", ")}]${failedMethods.length > 0 ? `. Failed: [${failedMethods.join(", ")}]` : ""}`
      : `Welcome notification failed. Errors: [${failedMethods.join(", ")}]`;

    return new Response(JSON.stringify({
      success: overallSuccess,
      message: responseMessage,
      patient_id: requestData.patient_id,
      results: results,
      successful_methods: successfulMethods,
      failed_methods: failedMethods
    }), {
      status: overallSuccess ? 200 : 207, // 207 Multi-Status for partial success
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in send-comprehensive-welcome-notification:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: "Failed to process welcome notifications"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
