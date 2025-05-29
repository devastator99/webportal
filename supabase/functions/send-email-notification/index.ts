
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY environment variable not found");
      throw new Error("RESEND_API_KEY not configured");
    }

    console.log("Resend API key found, length:", resendApiKey.length);

    const resend = new Resend(resendApiKey);
    const { to, subject, html, text } = await req.json();

    if (!to || !subject) {
      throw new Error("Missing required fields: to, subject");
    }

    console.log(`Sending email to: ${to} with subject: ${subject}`);

    // Use the default Resend sandbox domain for testing
    // In production, replace with your verified domain
    const fromEmail = "onboarding@resend.dev"; // This is Resend's verified sandbox domain

    const emailResponse = await resend.emails.send({
      from: `Healthcare Team <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: html || text,
      text: text
    });

    console.log("Email API response:", JSON.stringify(emailResponse, null, 2));

    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      throw new Error(`Email sending failed: ${emailResponse.error.message}`);
    }

    console.log("Email sent successfully, ID:", emailResponse.data?.id);

    return new Response(JSON.stringify({
      success: true,
      email_id: emailResponse.data?.id,
      message: "Email sent successfully"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
