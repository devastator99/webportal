
import { supabase } from "@/integrations/supabase/client";

// Utility to verify registration data storage
export const verifyRegistrationData = async (email: string) => {
  try {
    console.log("=== VERIFYING REGISTRATION DATA ===");
    console.log("Email:", email);
    
    // Get user from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching auth users:", authError);
      return { success: false, error: authError.message };
    }
    
    const user = authUser.users.find(u => u.email === email);
    if (!user) {
      console.log("User not found in auth.users");
      return { success: false, error: "User not found" };
    }
    
    console.log("Auth user metadata:", user.user_metadata);
    console.log("Raw user metadata:", user.raw_user_meta_data);
    
    // Check profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    console.log("Profile data:", profile);
    if (profileError) {
      console.error("Profile error:", profileError);
    }
    
    // Check user_roles table
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    console.log("User role data:", userRole);
    if (roleError) {
      console.error("User role error:", roleError);
    }
    
    // Check patient_details if user is a patient
    if (userRole?.role === 'patient') {
      const { data: patientDetails, error: patientError } = await supabase
        .from('patient_details')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log("Patient details data:", patientDetails);
      if (patientError) {
        console.error("Patient details error:", patientError);
      }
    }
    
    // Check registration tasks if user is a patient
    if (userRole?.role === 'patient') {
      const { data: tasks, error: tasksError } = await supabase
        .from('registration_tasks')
        .select('*')
        .eq('user_id', user.id);
      
      console.log("Registration tasks:", tasks);
      if (tasksError) {
        console.error("Registration tasks error:", tasksError);
      }
    }
    
    return {
      success: true,
      data: {
        auth_user: user,
        profile,
        user_role: userRole,
        phone_stored: !!profile?.phone,
        phone_value: profile?.phone
      }
    };
    
  } catch (error: any) {
    console.error("Error verifying registration data:", error);
    return { success: false, error: error.message };
  }
};

// Helper to find user by phone number (for SMS verification)
export const findUserByPhone = async (phoneNumber: string) => {
  try {
    console.log("=== FINDING USER BY PHONE ===");
    console.log("Looking for phone number:", phoneNumber);
    
    // Normalize phone number (add +91 if not present)
    let normalizedPhone = phoneNumber.trim();
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+91' + normalizedPhone;
    }
    
    console.log("Normalized phone number:", normalizedPhone);
    
    // Try to find user by phone in profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', normalizedPhone);
    
    console.log("Profiles found:", profiles);
    if (profileError) {
      console.error("Profile search error:", profileError);
      return { success: false, error: profileError.message };
    }
    
    if (!profiles || profiles.length === 0) {
      console.log("No user found with phone number:", normalizedPhone);
      return { success: false, error: "User not found" };
    }
    
    const profile = profiles[0];
    console.log("Found user profile:", profile);
    
    return {
      success: true,
      user: profile,
      phone_normalized: normalizedPhone
    };
    
  } catch (error: any) {
    console.error("Error finding user by phone:", error);
    return { success: false, error: error.message };
  }
};
