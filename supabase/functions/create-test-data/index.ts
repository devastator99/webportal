
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create test patient
    const { data: patientData, error: patientError } = await supabase.auth.admin.createUser({
      email: 'ram.naresh@example.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Ram',
        last_name: 'Naresh',
        user_type: 'patient'
      }
    });

    if (patientError) throw patientError;

    // Create test doctor
    const { data: doctorData, error: doctorError } = await supabase.auth.admin.createUser({
      email: 'vinay.pulkit@example.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Vinay',
        last_name: 'Pulkit',
        user_type: 'doctor'
      }
    });

    if (doctorError) throw doctorError;

    // Create patient assignment
    const { error: assignmentError } = await supabase
      .from('patient_assignments')
      .insert({
        patient_id: patientData.user.id,
        doctor_id: doctorData.user.id
      });

    if (assignmentError) throw assignmentError;

    // Create test appointments
    const today = new Date();
    const appointments = [
      new Date(today.setHours(10, 0, 0, 0)),
      new Date(today.setHours(11, 30, 0, 0)),
      new Date(today.setHours(14, 0, 0, 0)),
      new Date(today.setHours(15, 30, 0, 0))
    ];

    for (const appointmentTime of appointments) {
      const { error: appointmentError } = await supabase
        .rpc('create_appointment', {
          p_patient_id: patientData.user.id,
          p_doctor_id: doctorData.user.id,
          p_scheduled_at: appointmentTime.toISOString(),
          p_status: 'scheduled'
        });

      if (appointmentError) throw appointmentError;
    }

    return new Response(
      JSON.stringify({
        message: 'Test data created successfully',
        patient: patientData.user,
        doctor: doctorData.user
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
