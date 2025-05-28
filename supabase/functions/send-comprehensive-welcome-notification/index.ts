
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Twilio configuration
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

// Resend configuration
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface NotificationRequest {
  patient_id: string;
  doctor_name?: string;
  nutritionist_name?: string;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { 
      patient_id, 
      doctor_name, 
      nutritionist_name,
      patient_name,
      patient_email,
      patient_phone 
    }: NotificationRequest = await req.json();
    
    console.log("Sending comprehensive welcome notification for patient:", patient_id);
    
    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: "Patient ID is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Get patient details if not provided
    let patientData = {
      name: patient_name,
      email: patient_email,
      phone: patient_phone
    };
    
    if (!patient_name || !patient_email) {
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('id', patient_id)
        .single();
        
      if (profile) {
        patientData.name = patientData.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        patientData.email = patientData.email || profile.email;
        patientData.phone = patientData.phone || profile.phone;
      }
    }
    
    // Get care team details if not provided
    let careTeamData = {
      doctor_name,
      nutritionist_name
    };
    
    if (!doctor_name || !nutritionist_name) {
      const { data: assignment, error: assignmentError } = await supabaseClient
        .from('patient_assignments')
        .select(`
          doctor:profiles!patient_assignments_doctor_id_fkey(first_name, last_name),
          nutritionist:profiles!patient_assignments_nutritionist_id_fkey(first_name, last_name)
        `)
        .eq('patient_id', patient_id)
        .single();
        
      if (assignment) {
        careTeamData.doctor_name = careTeamData.doctor_name || 
          `Dr. ${assignment.doctor?.first_name || ''} ${assignment.doctor?.last_name || ''}`.trim();
        careTeamData.nutritionist_name = careTeamData.nutritionist_name || 
          `${assignment.nutritionist?.first_name || ''} ${assignment.nutritionist?.last_name || ''}`.trim();
      }
    }
    
    const results = {
      sms: { success: false, error: null },
      email: { success: false, error: null },
      whatsapp: { success: false, error: null },
      chat: { success: false, error: null }
    };
    
    // 1. Send SMS notification
    if (patientData.phone && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      try {
        const smsMessage = `Welcome to AnubhootiHealth! 🎉

Your registration is complete and your care team has been assigned:
👨‍⚕️ Doctor: ${careTeamData.doctor_name || 'Being assigned'}
🥗 Nutritionist: ${careTeamData.nutritionist_name || 'Being assigned'}

You can now access your dashboard and communicate with your care team through our platform.

Best regards,
AnubhootiHealth Team`;

        const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: TWILIO_PHONE_NUMBER,
            To: patientData.phone,
            Body: smsMessage
          }),
        });
        
        if (smsResponse.ok) {
          results.sms.success = true;
          console.log("SMS sent successfully to", patientData.phone);
        } else {
          const errorData = await smsResponse.text();
          results.sms.error = errorData;
          console.error("SMS sending failed:", errorData);
        }
      } catch (error: any) {
        results.sms.error = error.message;
        console.error("SMS error:", error);
      }
    }
    
    // 2. Send Email notification
    if (patientData.email && RESEND_API_KEY) {
      try {
        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to AnubhootiHealth</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #9b87f5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .care-team { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #9b87f5; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to AnubhootiHealth!</h1>
              <p>Your registration is complete</p>
            </div>
            <div class="content">
              <h2>Hello ${patientData.name || 'Dear Patient'},</h2>
              
              <p>Congratulations! Your registration with AnubhootiHealth has been successfully completed. We're excited to have you on board and begin this health journey with you.</p>
              
              <div class="care-team">
                <h3>🏥 Your Care Team</h3>
                <p><strong>👨‍⚕️ Doctor:</strong> ${careTeamData.doctor_name || 'Being assigned shortly'}</p>
                <p><strong>🥗 Nutritionist:</strong> ${careTeamData.nutritionist_name || 'Being assigned shortly'}</p>
              </div>
              
              <h3>🚀 What's Next?</h3>
              <ul>
                <li><strong>Access Your Dashboard:</strong> Log in to view your personalized health dashboard</li>
                <li><strong>Chat with Your Care Team:</strong> Use our secure messaging system to communicate with your doctor and nutritionist</li>
                <li><strong>Track Your Progress:</strong> Monitor your health journey with our comprehensive tracking tools</li>
                <li><strong>Upload Medical Records:</strong> Securely share your medical history with your care team</li>
              </ul>
              
              <h3>📱 Features Available to You:</h3>
              <ul>
                <li>Personalized health dashboard</li>
                <li>Secure care team communication</li>
                <li>Digital prescription management</li>
                <li>Health habit tracking</li>
                <li>Medical records storage</li>
                <li>Appointment scheduling</li>
              </ul>
              
              <p>If you have any questions or need assistance, don't hesitate to reach out to your care team through the platform or contact our support team.</p>
              
              <p>Welcome aboard, and here's to your health!</p>
              
              <p><strong>The AnubhootiHealth Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 AnubhootiHealth. All rights reserved.</p>
              <p>This email was sent regarding your registration completion.</p>
            </div>
          </div>
        </body>
        </html>`;

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'AnubhootiHealth <noreply@anubhootihealth.com>',
            to: [patientData.email],
            subject: '🎉 Welcome to AnubhootiHealth - Registration Complete!',
            html: emailHtml,
          }),
        });
        
        if (emailResponse.ok) {
          results.email.success = true;
          console.log("Email sent successfully to", patientData.email);
        } else {
          const errorData = await emailResponse.text();
          results.email.error = errorData;
          console.error("Email sending failed:", errorData);
        }
      } catch (error: any) {
        results.email.error = error.message;
        console.error("Email error:", error);
      }
    }
    
    // 3. Send WhatsApp notification (if phone supports WhatsApp)
    if (patientData.phone && TWILIO_WHATSAPP_NUMBER && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      try {
        const whatsappMessage = `🎉 *Welcome to AnubhootiHealth!*

Your registration is complete! ✅

*Your Care Team:*
👨‍⚕️ Doctor: ${careTeamData.doctor_name || 'Being assigned'}
🥗 Nutritionist: ${careTeamData.nutritionist_name || 'Being assigned'}

You can now access your personalized health dashboard and communicate with your care team.

Thank you for choosing AnubhootiHealth! 🏥💚`;

        const whatsappResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: TWILIO_WHATSAPP_NUMBER,
            To: `whatsapp:${patientData.phone}`,
            Body: whatsappMessage
          }),
        });
        
        if (whatsappResponse.ok) {
          results.whatsapp.success = true;
          console.log("WhatsApp sent successfully to", patientData.phone);
        } else {
          const errorData = await whatsappResponse.text();
          results.whatsapp.error = errorData;
          console.error("WhatsApp sending failed:", errorData);
        }
      } catch (error: any) {
        results.whatsapp.error = error.message;
        console.error("WhatsApp error:", error);
      }
    }
    
    // 4. Send care team chat message
    try {
      const { data: chatData, error: chatError } = await supabaseClient.functions.invoke('send-ai-care-team-message', {
        body: {
          patient_id: patient_id,
          title: "Welcome to AnubhootiHealth",
          message: `🎉 Welcome to AnubhootiHealth, ${patientData.name || 'Dear Patient'}!

Your registration is complete and your care team has been assigned. You can now communicate with your doctor and nutritionist through this secure chat.

Your Care Team:
👨‍⚕️ Doctor: ${careTeamData.doctor_name || 'Being assigned'}
🥗 Nutritionist: ${careTeamData.nutritionist_name || 'Being assigned'}

Feel free to reach out with any questions or health concerns. We're here to support your health journey!

Best regards,
Your AnubhootiHealth Care Team 💚`
        }
      });
      
      if (!chatError) {
        results.chat.success = true;
        console.log("Care team chat message sent successfully");
      } else {
        results.chat.error = chatError.message;
        console.error("Care team chat error:", chatError);
      }
    } catch (error: any) {
      results.chat.error = error.message;
      console.error("Chat error:", error);
    }
    
    // Log notification results
    await supabaseClient
      .from('notification_logs')
      .insert({
        patient_id: patient_id,
        notification_type: 'welcome_registration',
        channels_attempted: ['sms', 'email', 'whatsapp', 'chat'],
        results: results,
        sent_at: new Date().toISOString()
      })
      .select()
      .single();
    
    const successCount = Object.values(results).filter(r => r.success).length;
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Welcome notification sent via ${successCount}/4 channels`,
        results: results,
        patient_data: patientData,
        care_team_data: careTeamData
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error: any) {
    console.error("Error in send-comprehensive-welcome-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
