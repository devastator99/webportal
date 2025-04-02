
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
    console.log("Starting admin user creation...");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Supabase client initialized");

    // Check if admin exists
    const adminExists = await checkIfUserExists(supabase, 'admin@example.com');
    console.log("Admin exists check complete:", adminExists);
    
    // Only create the admin if it doesn't exist
    if (!adminExists) {
      console.log("Creating admin user...");
      // Create admin user
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

    return new Response(
      JSON.stringify({
        message: 'Admin user created successfully',
        test_credentials: {
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

// Helper function to check if user exists
async function checkIfUserExists(supabase, email) {
  try {
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
