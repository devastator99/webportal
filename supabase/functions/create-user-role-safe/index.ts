
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
    const { user_id, role, user_metadata } = await req.json();
    
    console.log(`Creating user role for ${user_id} with role ${role}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create user profile first
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: user_id,
        first_name: user_metadata?.first_name || user_metadata?.firstName,
        last_name: user_metadata?.last_name || user_metadata?.lastName,
        phone: user_metadata?.phone,
        registration_status: role === 'patient' ? 'payment_pending' : 'fully_registered'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }

    // Create user role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .upsert({
        user_id,
        role
      });

    if (roleError) {
      console.error('Error creating role:', roleError);
      throw roleError;
    }

    // If patient, create patient details
    if (role === 'patient' && user_metadata?.patientData) {
      const patientData = user_metadata.patientData;
      
      const { error: patientError } = await supabaseClient
        .from('patient_details')
        .upsert({
          id: user_id,
          gender: patientData.gender,
          date_of_birth: patientData.dateOfBirth,
          height: patientData.height ? parseFloat(patientData.height) : null,
          weight: patientData.weight ? parseFloat(patientData.weight) : null,
          blood_group: patientData.bloodGroup,
          allergies: patientData.allergies,
          chronic_conditions: patientData.chronicConditions,
          emergency_contact: patientData.emergencyContact
        });

      if (patientError) {
        console.error('Error creating patient details:', patientError);
        throw patientError;
      }
    }

    console.log(`User role created successfully for ${user_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User role and profile created successfully',
        user_id,
        role 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-user-role-safe:', error);
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
