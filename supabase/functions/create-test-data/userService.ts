
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const createOrUpdateUser = async (supabase: SupabaseClient, adminEmail: string, adminPassword: string) => {
  try {
    console.log("Attempting to create admin user directly");
    
    const { data: userCreateData, error: userCreateError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });
    
    if (userCreateError) {
      console.error("Error in first creation attempt:", userCreateError);
      
      if (userCreateError.message.includes('already exists')) {
        console.log("Admin user already exists, fetching user data");
        
        const { data: users } = await supabase.auth.admin.listUsers();
        const adminUser = users?.users.find(u => u.email === adminEmail);
        
        if (adminUser) {
          console.log("Found existing admin user:", adminUser.id);
          
          await supabase.auth.admin.updateUserById(adminUser.id, {
            password: adminPassword,
            email_confirm: true
          });
          
          await createProfileAndRole(supabase, adminUser.id, adminEmail);
          return { success: true, userId: adminUser.id };
        }
      }
      
      throw userCreateError;
    }
    
    if (userCreateData?.user) {
      console.log("Admin user created successfully:", userCreateData.user.id);
      await createProfileAndRole(supabase, userCreateData.user.id, adminEmail);
      return { success: true, userId: userCreateData.user.id };
    }
    
    throw new Error("User creation returned no data");
    
  } catch (error) {
    console.error("Exception during admin creation:", error);
    throw error;
  }
};

const createProfileAndRole = async (supabase: SupabaseClient, userId: string, email: string) => {
  console.log("Creating/updating profile and role for:", userId);
  
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
      console.error("Error creating profile:", profileError);
    } else {
      console.log("Profile created or updated successfully");
    }
  } catch (profileError) {
    console.error("Exception during profile creation:", profileError);
  }
  
  try {
    const { data: existingRoles } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (!existingRoles || existingRoles.length === 0) {
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
};
