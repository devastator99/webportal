
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Starting admin user creation process");
    
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase URL or service role key");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase client initialized");

    // Admin user details
    const adminEmail = 'admin@example.com';
    const adminPassword = 'testpassword123';
    
    // Simplified approach: Try to create user directly
    try {
      console.log("Attempting to create admin user directly");
      
      const { data: userCreateData, error: userCreateError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true
      });
      
      if (userCreateError) {
        console.error("Error in first creation attempt:", userCreateError);
        
        // If error indicates user exists, fetch the user
        if (userCreateError.message.includes('already exists')) {
          console.log("Admin user already exists, fetching user data");
          
          // Search for the user in auth.users table
          const { data: users } = await supabase.auth.admin.listUsers();
          const adminUser = users?.users.find(u => u.email === adminEmail);
          
          if (adminUser) {
            console.log("Found existing admin user:", adminUser.id);
            
            // Update password for existing user
            await supabase.auth.admin.updateUserById(adminUser.id, {
              password: adminPassword,
              email_confirm: true
            });
            
            // Create/update profile and role
            await createProfileAndRole(supabase, adminUser.id, adminEmail);
            
            return successResponse();
          } else {
            console.error("User reported as existing but not found in listUsers");
          }
        }
        
        // If we get here, there was an error and user wasn't found in listUsers
        console.log("Trying alternate creation approach");
        
        // Try a different approach using direct SQL
        try {
          // This is a fallback to ensure we get a user created one way or another
          const { data: fallbackUser, error: fallbackError } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPassword
          });
          
          if (fallbackError) {
            console.error("Fallback signup failed:", fallbackError);
            throw fallbackError;
          }
          
          if (fallbackUser?.user) {
            console.log("Created admin via fallback method:", fallbackUser.user.id);
            
            // Confirm email directly
            await supabase.auth.admin.updateUserById(fallbackUser.user.id, {
              email_confirm: true
            });
            
            // Create profile and role
            await createProfileAndRole(supabase, fallbackUser.user.id, adminEmail);
            
            return successResponse();
          }
        } catch (fallbackCatchError) {
          console.error("Error in fallback method:", fallbackCatchError);
        }
        
        // If all attempts failed, return the original error
        return new Response(
          JSON.stringify({ error: "Failed to create admin user", details: userCreateError.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
      
      // User was created successfully
      if (userCreateData?.user) {
        console.log("Admin user created successfully:", userCreateData.user.id);
        
        // Create profile and role
        await createProfileAndRole(supabase, userCreateData.user.id, adminEmail);
        
        return successResponse();
      }
      
      // No user data returned
      return new Response(
        JSON.stringify({ error: "User creation returned no data" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
      
    } catch (directCreateError) {
      console.error("Exception during direct admin creation:", directCreateError);
      
      return new Response(
        JSON.stringify({ 
          error: "Server error during admin creation", 
          details: directCreateError.message || "Unknown error" 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (outerError) {
    console.error("Unhandled outer exception:", outerError);
    
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
  
  // Helper function to create/update profile and role
  async function createProfileAndRole(supabase, userId, email) {
    console.log("Creating/updating profile and role for:", userId);
    
    try {
      // Create/update profile - using upsert to handle both create and update cases
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          first_name: 'Admin',
          last_name: 'User'
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      } else {
        console.log("Profile created or updated successfully");
      }
    } catch (profileError) {
      console.error("Exception during profile creation:", profileError);
    }
    
    try {
      // Check if role already exists
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
          console.error("Error creating role:", roleError);
        } else {
          console.log("Role created successfully");
        }
      } else {
        // Update role if needed
        if (existingRoles[0].role !== 'administrator') {
          const { error: roleUpdateError } = await supabase
            .from('user_roles')
            .update({ role: 'administrator' })
            .eq('user_id', userId);
            
          if (roleUpdateError) {
            console.error("Error updating role:", roleUpdateError);
          } else {
            console.log("Role updated successfully");
          }
        } else {
          console.log("Admin role already assigned");
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
