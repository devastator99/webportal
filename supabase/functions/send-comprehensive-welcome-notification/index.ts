
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
    
    // Determine the role from patient_details
    const userRole = data.patient_details?.role || 'patient';
    const isPatient = userRole === 'patient';
    const isDoctor = userRole === 'doctor';
    const isNutritionist = userRole === 'nutritionist';
    const isAdministrator = userRole === 'administrator';
    
    let emailSubject: string;
    let roleName: string;
    
    if (isPatient) {
      emailSubject = `Welcome to AnubhootiHealth, ${data.patient_name}!`;
      roleName = "Patient";
    } else if (isDoctor) {
      emailSubject = `Welcome to AnubhootiHealth Medical Team, Dr. ${data.patient_name}!`;
      roleName = "Doctor";
    } else if (isNutritionist) {
      emailSubject = `Welcome to AnubhootiHealth Nutrition Team, ${data.patient_name}!`;
      roleName = "Nutritionist";
    } else if (isAdministrator) {
      emailSubject = `Welcome to AnubhootiHealth Administration, ${data.patient_name}!`;
      roleName = "Administrator";
    } else {
      emailSubject = `Welcome to AnubhootiHealth, ${data.patient_name}!`;
      roleName = "Team Member";
    }
    
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
          <p>${isPatient ? 'Your journey to better health starts now' : 'Thank you for joining our healthcare team'}</p>
        </div>
        
        <div class="content">
          <h2>Hello ${data.patient_name},</h2>
          
          ${isPatient ? `
            <p>Congratulations! Your registration is complete and your personalized care team has been assigned. We're excited to be part of your health journey.</p>
          ` : `
            <p>Welcome to the AnubhootiHealth team! Your ${roleName.toLowerCase()} account has been successfully created and you now have access to our healthcare platform.</p>
          `}
          
          <div class="highlight">
            <h3>✅ Your Account is Ready!</h3>
            <p>You can now access all features of the AnubhootiHealth platform:</p>
            <ul>
              ${isPatient ? `
                <li>📱 Secure messaging with your care team</li>
                <li>📋 Digital health records management</li>
                <li>💊 Prescription tracking</li>
                <li>📊 Personalized health dashboard</li>
                <li>🎯 Custom health plans and goals</li>
              ` : `
                <li>👥 Care team collaboration tools</li>
                <li>📱 Secure patient communication</li>
                <li>📋 Patient management dashboard</li>
                <li>📊 Health analytics and reporting</li>
                <li>🔧 Professional healthcare tools</li>
              `}
            </ul>
          </div>
          
          ${(data.doctor_name || data.nutritionist_name) && isPatient ? `
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
              ${isPatient ? `
                <li>Complete your health profile for personalized recommendations</li>
                <li>Check your messages - your care team may have already sent you a welcome message</li>
                <li>Set up your notification preferences</li>
              ` : `
                <li>Complete your professional profile setup</li>
                <li>Explore the ${roleName.toLowerCase()} dashboard and tools</li>
                <li>Join the care team communication channels</li>
              `}
            </ol>
          </div>
          
          <p>${isPatient ? 
            'If you have any questions or need assistance, don\'t hesitate to reach out to your care team through the platform\'s secure messaging system.' :
            'If you have any questions about using the platform or need technical assistance, please contact our support team.'
          }</p>
          
          <p>Welcome aboard!</p>
          
          <div class="footer">
            <p><strong>The AnubhootiHealth Team</strong></p>
            <p>🌟 ${isPatient ? 'Empowering your health journey with personalized care' : 'Empowering healthcare professionals with advanced tools'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
      Welcome to AnubhootiHealth, ${data.patient_name}!
      
      ${isPatient ? 
        'Congratulations! Your registration is complete and your personalized care team has been assigned.' :
        `Welcome to the AnubhootiHealth team! Your ${roleName.toLowerCase()} account has been successfully created.`
      }
      
      Your Account is Ready!
      You can now access:
      ${isPatient ? `
      - Secure messaging with your care team
      - Digital health records management
      - Prescription tracking
      - Personalized health dashboard
      - Custom health plans and goals
      ` : `
      - Care team collaboration tools
      - Secure patient communication
      - Patient management dashboard
      - Health analytics and reporting
      - Professional healthcare tools
      `}
      
      ${data.doctor_name ? `Your Doctor: ${data.doctor_name}` : ''}
      ${data.nutritionist_name ? `Your Nutritionist: ${data.nutritionist_name}` : ''}
      
      Next Steps:
      1. Log into your dashboard to explore your new account
      ${isPatient ? `
      2. Complete your health profile for personalized recommendations
      3. Check your messages from your care team
      4. Set up your notification preferences
      ` : `
      2. Complete your professional profile setup
      3. Explore the ${roleName.toLowerCase()} dashboard and tools
      4. Join the care team communication channels
      `}
      
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

// Enhanced SMS notification function for all user types
async function sendSmsNotification(supabaseClient: any, data: NotificationRequest): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    if (!data.patient_phone) {
      console.log("No phone number provided, skipping SMS");
      return { success: false, error: "No phone number provided" };
    }

    console.log(`Attempting SMS notification to: ${data.patient_phone}`);
    
    // Determine the role from patient_details
    const userRole = data.patient_details?.role || 'patient';
    const isPatient = userRole === 'patient';
    const isDoctor = userRole === 'doctor';
    const isNutritionist = userRole === 'nutritionist';
    const isAdministrator = userRole === 'administrator';
    
    let smsMessage: string;
    
    if (isPatient) {
      smsMessage = `Welcome to AnubhootiHealth, ${data.patient_name}! Your registration is complete and your care team has been assigned. ${data.doctor_name ? `Doctor: ${data.doctor_name}. ` : ''}${data.nutritionist_name ? `Nutritionist: ${data.nutritionist_name}. ` : ''}Log in to access your personalized health dashboard.`;
    } else if (isDoctor) {
      smsMessage = `Welcome to AnubhootiHealth Medical Team, Dr. ${data.patient_name}! Your doctor account is now active. Access your dashboard to manage patients, prescriptions, and care team collaboration. Thank you for joining our healthcare platform.`;
    } else if (isNutritionist) {
      smsMessage = `Welcome to AnubhootiHealth Nutrition Team, ${data.patient_name}! Your nutritionist account is now active. Access your dashboard to create health plans, manage patients, and collaborate with the care team. Thank you for joining our platform.`;
    } else if (isAdministrator) {
      smsMessage = `Welcome to AnubhootiHealth Administration, ${data.patient_name}! Your administrator account is now active. Access your admin dashboard to manage users, assignments, and system operations.`;
    } else {
      smsMessage = `Welcome to AnubhootiHealth, ${data.patient_name}! Your account is now active. Log in to access your dashboard and explore our healthcare platform features.`;
    }

    const { data: smsResult, error: smsError } = await supabaseClient.functions.invoke('send-sms-notification', {
      body: {
        phone_number: data.patient_phone,
        message: smsMessage,
        user_id: data.patient_id
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
    console.log("User role:", requestData.patient_details?.role || 'patient');

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

    // Always attempt SMS notification for all user types (not just patients)
    console.log("Attempting SMS notification for all user types...");
    results.sms = await sendSmsNotification(supabaseClient, requestData);

    // Log comprehensive results
    console.log("Notification results:", {
      patient_id: requestData.patient_id,
      user_role: requestData.patient_details?.role || 'patient',
      email_success: results.email.success,
      sms_success: results.sms.success,
      email_error: results.email.error,
      sms_error: results.sms.error
    });

    // Determine overall success - email is primary, SMS is optional but important
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
      user_role: requestData.patient_details?.role || 'patient',
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
