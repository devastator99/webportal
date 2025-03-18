
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

    // Create patient profile
    const { error: patientProfileError } = await supabase
      .from('profiles')
      .insert({
        id: patientData.user.id,
        first_name: 'Ram',
        last_name: 'Naresh'
      });

    if (patientProfileError) throw patientProfileError;

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

    // Create doctor profile
    const { error: doctorProfileError } = await supabase
      .from('profiles')
      .insert({
        id: doctorData.user.id,
        first_name: 'Vinay',
        last_name: 'Pulkit'
      });

    if (doctorProfileError) throw doctorProfileError;

    // Create test nutritionist
    const { data: nutritionistData, error: nutritionistError } = await supabase.auth.admin.createUser({
      email: 'mary.johnson@example.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Mary',
        last_name: 'Johnson',
        user_type: 'nutritionist'
      }
    });

    if (nutritionistError) throw nutritionistError;

    // Create nutritionist profile
    const { error: nutritionistProfileError } = await supabase
      .from('profiles')
      .insert({
        id: nutritionistData.user.id,
        first_name: 'Mary',
        last_name: 'Johnson'
      });

    if (nutritionistProfileError) throw nutritionistProfileError;

    // Create test administrator
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User',
        user_type: 'administrator'
      }
    });

    if (adminError) throw adminError;

    // Create admin profile
    const { error: adminProfileError } = await supabase
      .from('profiles')
      .insert({
        id: adminData.user.id,
        first_name: 'Admin',
        last_name: 'User'
      });

    if (adminProfileError) throw adminProfileError;

    // Create user roles
    await supabase.from('user_roles').insert([
      { user_id: patientData.user.id, role: 'patient' },
      { user_id: doctorData.user.id, role: 'doctor' },
      { user_id: nutritionistData.user.id, role: 'nutritionist' },
      { user_id: adminData.user.id, role: 'administrator' }
    ]);

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
        .from('appointments')
        .insert({
          patient_id: patientData.user.id,
          doctor_id: doctorData.user.id,
          scheduled_at: appointmentTime.toISOString(),
          status: 'scheduled'
        });

      if (appointmentError) throw appointmentError;
    }

    return new Response(
      JSON.stringify({
        message: 'Test data created successfully',
        patient: patientData.user,
        doctor: doctorData.user,
        nutritionist: nutritionistData.user,
        administrator: adminData.user,
        test_credentials: {
          patient: {
            email: 'ram.naresh@example.com',
            password: 'testpassword123'
          },
          doctor: {
            email: 'vinay.pulkit@example.com',
            password: 'testpassword123'
          },
          nutritionist: {
            email: 'mary.johnson@example.com',
            password: 'testpassword123'
          },
          administrator: {
            email: 'admin@example.com',
            password: 'testpassword123'
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
