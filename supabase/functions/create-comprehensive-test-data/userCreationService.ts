
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const createTestUser = async (
  supabase: SupabaseClient,
  email: string,
  phone: string,
  role: string,
  index: number
) => {
  try {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        test_user: true,
        purpose: 'password_reset_and_email_testing',
        created_for_testing: new Date().toISOString()
      }
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log(`[Test Data] User already exists: ${email}`);
        return null;
      } else {
        console.log(`[Test Data] Auth error for ${email}:`, authError.message);
        return null;
      }
    }

    if (authUser.user) {
      await createUserProfile(supabase, authUser.user.id, email, phone, role, index);
      await assignUserRole(supabase, authUser.user.id, role);
      
      return {
        id: authUser.user.id,
        email,
        phone,
        role,
        purpose: 'password_reset_and_email_testing',
        initialPassword: 'TestPassword123!'
      };
    }
    
    return null;
  } catch (error) {
    console.log(`[Test Data] Error creating user ${email}:`, error.message);
    return null;
  }
};

const createUserProfile = async (
  supabase: SupabaseClient,
  userId: string,
  email: string,
  phone: string,
  role: string,
  index: number
) => {
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      first_name: `Test${role.charAt(0).toUpperCase() + role.slice(1)}`,
      last_name: `User${index + 1}`,
      email: email,
      phone_number: phone,
      emergency_contact: phone,
      specialty: role === 'doctor' ? 'General Medicine' : null,
      updated_at: new Date().toISOString()
    });

  if (profileError) {
    console.log(`[Test Data] Profile error for ${email}:`, profileError.message);
  }
};

const assignUserRole = async (
  supabase: SupabaseClient,
  userId: string,
  role: string
) => {
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role: role
    });

  if (roleError) {
    console.log(`[Test Data] Role error:`, roleError.message);
  }
};
