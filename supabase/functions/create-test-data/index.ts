
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
    console.log("Starting test data creation...");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Supabase client initialized");

    // Fix: Instead of using auth.users table directly (which requires higher privileges),
    // we'll first check if we can authenticate with these credentials
    const adminExists = await checkIfUserExists(supabase, 'admin@example.com');
    console.log("Admin exists check complete:", adminExists);
    
    // Only create the admin if it doesn't exist
    if (!adminExists) {
      console.log("Creating admin user...");
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

      if (adminError) {
        console.error("Error creating admin user:", adminError);
        throw adminError;
      }

      console.log("Admin user created:", adminData.user.id);

      // Create admin profile
      const { error: adminProfileError } = await supabase
        .from('profiles')
        .insert({
          id: adminData.user.id,
          first_name: 'Admin',
          last_name: 'User'
        });

      if (adminProfileError) {
        console.error("Error creating admin profile:", adminProfileError);
        throw adminProfileError;
      }

      // Create admin role
      const { error: adminRoleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: adminData.user.id,
          role: 'administrator'
        });

      if (adminRoleError) {
        console.error("Error creating admin role:", adminRoleError);
        throw adminRoleError;
      }
      
      console.log("Admin user setup completed");
    } else {
      console.log("Admin user already exists, skipping creation");
    }

    // Check if patient exists before creating
    const patientExists = await checkIfUserExists(supabase, 'ram.naresh@example.com');
    let patientData = null;
    
    if (!patientExists) {
      // Create test patient
      const { data: newPatientData, error: patientError } = await supabase.auth.admin.createUser({
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
      patientData = newPatientData;

      // Create patient profile
      const { error: patientProfileError } = await supabase
        .from('profiles')
        .insert({
          id: newPatientData.user.id,
          first_name: 'Ram',
          last_name: 'Naresh'
        });

      if (patientProfileError) throw patientProfileError;
      
      // Create patient role
      const { error: patientRoleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: newPatientData.user.id,
          role: 'patient'
        });

      if (patientRoleError) throw patientRoleError;
      
      console.log("Patient user setup completed");
    } else {
      console.log("Patient user already exists, skipping creation");
    }

    // Check if doctor exists before creating
    const doctorExists = await checkIfUserExists(supabase, 'vinay.pulkit@example.com');
    let doctorData = null;
    
    if (!doctorExists) {
      // Create test doctor
      const { data: newDoctorData, error: doctorError } = await supabase.auth.admin.createUser({
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
      doctorData = newDoctorData;

      // Create doctor profile
      const { error: doctorProfileError } = await supabase
        .from('profiles')
        .insert({
          id: newDoctorData.user.id,
          first_name: 'Vinay',
          last_name: 'Pulkit'
        });

      if (doctorProfileError) throw doctorProfileError;
      
      // Create doctor role
      const { error: doctorRoleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: newDoctorData.user.id,
          role: 'doctor'
        });

      if (doctorRoleError) throw doctorRoleError;
      
      console.log("Doctor user setup completed");
    } else {
      console.log("Doctor user already exists, skipping creation");
    }

    // Check if nutritionist exists before creating
    const nutritionistExists = await checkIfUserExists(supabase, 'mary.johnson@example.com');
    let nutritionistData = null;
    
    if (!nutritionistExists) {
      // Create test nutritionist
      const { data: newNutritionistData, error: nutritionistError } = await supabase.auth.admin.createUser({
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
      nutritionistData = newNutritionistData;

      // Create nutritionist profile
      const { error: nutritionistProfileError } = await supabase
        .from('profiles')
        .insert({
          id: newNutritionistData.user.id,
          first_name: 'Mary',
          last_name: 'Johnson'
        });

      if (nutritionistProfileError) throw nutritionistProfileError;
      
      // Create nutritionist role
      const { error: nutritionistRoleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: newNutritionistData.user.id,
          role: 'nutritionist'
        });

      if (nutritionistRoleError) throw nutritionistRoleError;
      
      console.log("Nutritionist user setup completed");
    } else {
      console.log("Nutritionist user already exists, skipping creation");
    }

    // Add patient assignment if both patient and doctor exist
    if (patientData && doctorData) {
      // Create patient assignment 
      const { error: assignmentError } = await supabase
        .from('patient_assignments')
        .insert({
          patient_id: patientData.user.id,
          doctor_id: doctorData.user.id
        });

      if (assignmentError) {
        // If the assignment already exists, we can ignore this error
        console.log("Note: Patient assignment may already exist", assignmentError);
      }

      // Create test appointments if both patient and doctor exist
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

        if (appointmentError) {
          console.log("Note: Appointment may already exist", appointmentError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Test data created successfully',
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
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Helper function to check if user exists without directly querying auth.users
async function checkIfUserExists(supabase, email) {
  try {
    // Try to sign in with the user - this won't actually sign in but will tell us if the user exists
    const { data, error } = await supabase.auth.admin.getUserByEmail(email);
    
    // If we get a user back, the user exists
    if (data?.user) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    return false;
  }
}
