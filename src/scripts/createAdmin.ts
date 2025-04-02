
import { supabase } from "../integrations/supabase/client";

/**
 * This script creates an admin user in Supabase
 * Run it with: npx tsx src/scripts/createAdmin.ts
 */
async function createAdminUser() {
  console.log("Starting admin user creation...");
  
  try {
    // Check if admin user already exists
    const { data: existingAdmin, error: checkError } = await supabase.auth.signInWithPassword({
      email: "admin@example.com",
      password: "testpassword123"
    });

    if (existingAdmin?.user) {
      console.log("Admin user already exists. You can log in with:");
      console.log("Email: admin@example.com");
      console.log("Password: testpassword123");
      return;
    }
    
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
      throw adminRoleError;
    }
    
    console.log("Admin user setup completed successfully!");
    console.log("You can now log in with:");
    console.log("Email: admin@example.com");
    console.log("Password: testpassword123");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Execute the function
createAdminUser()
  .then(() => {
    console.log("Script execution completed");
    process.exit(0);
  })
  .catch(err => {
    console.error("Script execution failed:", err);
    process.exit(1);
  });
