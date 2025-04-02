
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
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase URL or service role key");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error", 
          details: "Missing required environment variables" 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Supabase client initialized");

    // Define admin email for easier reference
    const adminEmail = 'admin@example.com';
    
    // Check if admin exists using a simpler query first
    const { data: existingUsers, error: queryError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', adminEmail)
      .maybeSingle();
      
    if (queryError) {
      console.error("Error querying profiles table:", queryError);
      // Continue anyway, as the user might not exist yet
    }
    
    let adminExists = false;
    let adminUserId = null;
    
    if (existingUsers?.id) {
      adminExists = true;
      adminUserId = existingUsers.id;
      console.log("Admin user found in profiles table:", adminUserId);
    } else {
      // Try looking up the user in auth.users as a fallback
      try {
        const { data: userData, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error("Error listing users:", authError);
        } else if (userData) {
          const adminUser = userData.users.find(user => user.email === adminEmail);
          if (adminUser) {
            adminExists = true;
            adminUserId = adminUser.id;
            console.log("Admin user found in auth.users:", adminUserId);
          }
        }
      } catch (authLookupError) {
        console.error("Error during auth lookup:", authLookupError);
        // Continue with user creation attempt
      }
    }
    
    // Only create the admin if it doesn't exist
    if (!adminExists) {
      console.log("Creating admin user...");
      try {
        // Create admin user with email confirmation set to true
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
          email: adminEmail,
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
          return new Response(
            JSON.stringify({ 
              error: "Error creating admin user", 
              details: adminError.message
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }

        if (!adminData?.user?.id) {
          console.error("Admin user creation failed - no user ID returned");
          return new Response(
            JSON.stringify({ 
              error: "Admin user creation failed", 
              details: "No user ID returned"
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            }
          );
        }

        console.log("Admin user created:", adminData.user.id);
        adminUserId = adminData.user.id;

        // Create admin profile
        const { error: adminProfileError } = await supabase
          .from('profiles')
          .insert({
            id: adminUserId,
            first_name: 'Admin',
            last_name: 'User',
            email: adminEmail
          });

        if (adminProfileError) {
          console.error("Error creating admin profile:", adminProfileError);
          // Continue anyway, might be due to RLS or the profile already existing
        }

        // Create admin role
        const { error: adminRoleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: adminUserId,
            role: 'administrator'
          });

        if (adminRoleError) {
          console.error("Error creating admin role:", adminRoleError);
          // Continue anyway, might be due to RLS or the role already existing
        }
        
        console.log("Admin user setup completed successfully");
      } catch (creationError) {
        console.error("Exception during admin user creation:", creationError);
        return new Response(
          JSON.stringify({ 
            error: "Exception creating admin user", 
            details: creationError.toString() 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    } else {
      console.log("Admin user already exists, skipping creation");
    }

    return new Response(
      JSON.stringify({
        message: 'Admin user setup complete',
        success: true,
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
    console.error('Unhandled exception:', error);
    return new Response(
      JSON.stringify({ 
        error: "Server error", 
        details: error.message || "Unknown error occurred",
        stack: error.stack || "No stack trace available"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
