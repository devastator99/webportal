
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

    // Define admin data for easier reference
    const adminEmail = 'admin@example.com';
    const adminPassword = 'testpassword123';
    
    // First, directly try to create the admin user without checking for existence
    // This is to avoid potential issues with the email check query
    console.log("Creating admin user...");
    
    try {
      const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, 
        user_metadata: {
          first_name: 'Admin',
          last_name: 'User'
        }
      });

      // If there's an error about the user already existing, we can ignore it
      if (adminError) {
        if (adminError.message.includes('already exists')) {
          console.log("Admin user already exists, fetching user ID...");
          // Try to get the existing user's ID
          const { data: userData } = await supabase.auth.admin.listUsers();
          const existingAdmin = userData?.users.find(user => user.email === adminEmail);
          
          if (existingAdmin?.id) {
            console.log("Found existing admin user:", existingAdmin.id);
            // Try to update the admin user's password
            await supabase.auth.admin.updateUserById(existingAdmin.id, {
              password: adminPassword,
              email_confirm: true,
            });
            
            // Ensure admin has correct profile and role
            await ensureAdminProfileAndRole(supabase, existingAdmin.id, adminEmail);
            
            return successResponse();
          }
        } else {
          // If it's any other error, report it
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
      } else if (adminData?.user) {
        console.log("Admin user created successfully:", adminData.user.id);
        
        // Create admin profile and role
        await ensureAdminProfileAndRole(supabase, adminData.user.id, adminEmail);
        
        return successResponse();
      }
    } catch (error) {
      console.error("Exception during admin creation attempt:", error);
      // We'll continue to the next approach
    }
    
    // If direct creation failed, try a more careful approach
    console.log("Falling back to alternate admin creation approach...");
    
    // First, try to find the admin user
    let adminUserId = null;
    let adminExists = false;
    
    try {
      // Check auth.users first
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const adminUser = usersData?.users.find(user => user.email === adminEmail);
      
      if (adminUser?.id) {
        adminUserId = adminUser.id;
        adminExists = true;
        console.log("Admin user found in auth.users:", adminUserId);
      } else {
        // If not found, try creating a new admin user
        console.log("Admin not found in auth.users, creating new admin...");
        const { data: newAdminData, error: newAdminError } = await supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            first_name: 'Admin',
            last_name: 'User'
          }
        });

        if (newAdminError) {
          throw new Error(`Failed to create admin: ${newAdminError.message}`);
        }

        if (!newAdminData?.user?.id) {
          throw new Error("No user ID returned after admin creation");
        }

        adminUserId = newAdminData.user.id;
        console.log("New admin user created:", adminUserId);
      }
      
      // Ensure admin has profile and role
      await ensureAdminProfileAndRole(supabase, adminUserId, adminEmail);
      
      return successResponse();
    } catch (finalError) {
      console.error("Final error during admin creation:", finalError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create or update admin user", 
          details: finalError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (outerError) {
    console.error("Unhandled exception:", outerError);
    return new Response(
      JSON.stringify({ 
        error: "Server error", 
        details: outerError.message || "Unknown error occurred"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
  
  // Helper functions
  async function ensureAdminProfileAndRole(supabase, userId, email) {
    // Try to create or update profile
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          first_name: 'Admin',
          last_name: 'User'
        });

      if (profileError) {
        console.error("Error upserting profile:", profileError);
      }
    } catch (profileError) {
      console.error("Exception during profile upsert:", profileError);
    }
    
    // Try to create or update role
    try {
      // Check if role exists first
      const { data: existingRoles } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      
      if (!existingRoles || existingRoles.length === 0) {
        // Create role if it doesn't exist
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'administrator'
          });

        if (roleError) {
          console.error("Error inserting role:", roleError);
        }
      } else {
        // Update role if it exists but is wrong
        if (existingRoles[0].role !== 'administrator') {
          const { error: updateRoleError } = await supabase
            .from('user_roles')
            .update({ role: 'administrator' })
            .eq('user_id', userId);
            
          if (updateRoleError) {
            console.error("Error updating role:", updateRoleError);
          }
        }
      }
    } catch (roleError) {
      console.error("Exception during role management:", roleError);
    }
  }
  
  function successResponse() {
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
  }
});
