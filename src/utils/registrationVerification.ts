
import { supabase } from "@/integrations/supabase/client";

// Utility to verify registration data storage
export const verifyRegistrationData = async (email: string) => {
  try {
    console.log("=== VERIFYING REGISTRATION DATA ===");
    console.log("Email:", email);
    
    // Get user from auth with proper typing
    const { data, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching auth users:", authError);
      return { success: false, error: authError.message };
    }
    
    // Find user by email with proper null checking
    const user = data.users?.find((u: any) => u.email === email);
    if (!user) {
      console.log("User not found in auth.users");
      return { success: false, error: "User not found" };
    }
    
    console.log("Auth user metadata:", user.user_metadata);
    console.log("Raw user metadata:", user.user_metadata);
    
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
    
    // Normalize phone number variants to check multiple formats
    const phoneVariants = [
      phoneNumber.trim(),
      phoneNumber.replace(/\s+/g, ''), // Remove spaces
      phoneNumber.replace(/[-\s]/g, ''), // Remove dashes and spaces
    ];
    
    // Add +91 prefix variants if not present
    phoneVariants.forEach(variant => {
      if (!variant.startsWith('+91') && !variant.startsWith('91')) {
        phoneVariants.push('+91' + variant);
        phoneVariants.push('91' + variant);
      }
      if (variant.startsWith('91') && !variant.startsWith('+91')) {
        phoneVariants.push('+' + variant);
      }
    });
    
    // Remove duplicates
    const uniqueVariants = [...new Set(phoneVariants)];
    
    console.log("Checking phone variants:", uniqueVariants);
    
    // Try to find user by any of the phone variants
    for (const variant of uniqueVariants) {
      console.log("Checking variant:", variant);
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', variant);
      
      console.log(`Profiles found for ${variant}:`, profiles);
      
      if (profileError) {
        console.error(`Profile search error for ${variant}:`, profileError);
        continue;
      }
      
      if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        console.log("Found user profile:", profile);
        
        // Get user role
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', profile.id)
          .single();
        
        console.log("User role:", userRole);
        
        // Get registration status
        const { data: registrationStatus, error: regError } = await supabase.rpc(
          'get_user_registration_status_safe',
          { p_user_id: profile.id }
        );
        
        console.log("Registration status:", registrationStatus);
        
        return {
          success: true,
          user: profile,
          role: userRole?.role,
          registration_status: registrationStatus,
          phone_normalized: variant,
          phone_variants_checked: uniqueVariants
        };
      }
    }
    
    console.log("No user found with any phone number variant");
    return { 
      success: false, 
      error: "User not found",
      phone_variants_checked: uniqueVariants 
    };
    
  } catch (error: any) {
    console.error("Error finding user by phone:", error);
    return { success: false, error: error.message };
  }
};

// Helper to check registration status by email
export const checkRegistrationByEmail = async (email: string) => {
  try {
    console.log("=== CHECKING REGISTRATION BY EMAIL ===");
    console.log("Email:", email);
    
    // First get the user from profiles using a direct query
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .or(`id.in.(select id from auth.users where email='${email}')`);
    
    if (profileError) {
      console.error("Error finding profile by email:", profileError);
      return { success: false, error: profileError.message };
    }
    
    if (!profiles || profiles.length === 0) {
      console.log("No profile found for email:", email);
      return { success: false, error: "No profile found for this email" };
    }
    
    const profile = profiles[0];
    console.log("Found profile:", profile);
    
    // Get registration status
    const { data: registrationStatus, error: regError } = await supabase.rpc(
      'get_user_registration_status_safe',
      { p_user_id: profile.id }
    );
    
    console.log("Registration status:", registrationStatus);
    
    return {
      success: true,
      profile,
      registration_status: registrationStatus,
      phone_number: profile.phone
    };
    
  } catch (error: any) {
    console.error("Error checking registration by email:", error);
    return { success: false, error: error.message };
  }
};
