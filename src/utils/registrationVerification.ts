
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

// Helper to find user by phone number (for SMS verification) - Enhanced version
export const findUserByPhone = async (phoneNumber: string) => {
  try {
    console.log("=== FINDING USER BY PHONE ===");
    console.log("Looking for phone number:", phoneNumber);
    
    // Normalize phone number variants to check multiple formats
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, ''); // Remove all non-digit and non-plus characters
    const phoneVariants = [
      phoneNumber.trim(),
      cleanPhone,
      phoneNumber.replace(/\s+/g, ''), // Remove spaces
      phoneNumber.replace(/[-\s]/g, ''), // Remove dashes and spaces
    ];
    
    // Add +91 prefix variants if not present
    phoneVariants.forEach(variant => {
      const digitsOnly = variant.replace(/\D/g, ''); // Get only digits
      
      if (digitsOnly.length === 10) {
        // 10 digit number, add country code variants
        phoneVariants.push('+91' + digitsOnly);
        phoneVariants.push('91' + digitsOnly);
      }
      
      if (variant.startsWith('91') && !variant.startsWith('+91') && digitsOnly.length === 12) {
        phoneVariants.push('+' + variant);
      }
      
      if (variant.startsWith('+91') && digitsOnly.length === 12) {
        phoneVariants.push(variant.substring(1)); // Remove the +
      }
    });
    
    // Remove duplicates and empty strings
    const uniqueVariants = [...new Set(phoneVariants)].filter(v => v.length > 0);
    
    console.log("Checking phone variants:", uniqueVariants);
    
    // First, let's see ALL phone numbers in the database for debugging
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone')
      .not('phone', 'is', null);
    
    console.log("All phone numbers in database:", allProfiles?.map(p => ({ 
      name: `${p.first_name} ${p.last_name}`, 
      phone: p.phone 
    })));
    
    // Try to find user by any of the phone variants in profiles table
    for (const variant of uniqueVariants) {
      console.log("Checking variant in profiles:", variant);
      
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
          phone_variants_checked: uniqueVariants,
          all_database_phones: allProfiles?.map(p => ({ 
            name: `${p.first_name} ${p.last_name}`, 
            phone: p.phone 
          }))
        };
      }
    }
    
    console.log("No user found with any phone number variant");
    return { 
      success: false, 
      error: "User not found",
      phone_variants_checked: uniqueVariants,
      all_database_phones: allProfiles?.map(p => ({ 
        name: `${p.first_name} ${p.last_name}`, 
        phone: p.phone 
      }))
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

// Updated phone migration function that works with current user session
export const migratePhoneNumbersFromMetadata = async () => {
  try {
    console.log("=== MIGRATING PHONE NUMBERS FROM METADATA ===");
    
    // Get the current user's session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        success: false, 
        error: "No authenticated user found. Please login first." 
      };
    }
    
    console.log("Current user:", user);
    console.log("User metadata:", user.user_metadata);
    
    const metadataPhone = user.user_metadata?.phone;
    let migratedCount = 0;
    const results = [];
    
    if (metadataPhone) {
      console.log(`Checking current user ${user.id} with metadata phone: ${metadataPhone}`);
      
      // Check if profile already has phone
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();
      
      if (!profileError && (!profile?.phone || profile.phone === '')) {
        console.log(`Updating profile for user ${user.id} with phone: ${metadataPhone}`);
        
        // Update profile with phone from metadata
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ phone: metadataPhone })
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`Error updating profile for ${user.id}:`, updateError);
          results.push({ 
            user_id: user.id, 
            success: false, 
            error: updateError.message,
            phone: metadataPhone 
          });
        } else {
          console.log(`Successfully updated profile for ${user.id}`);
          migratedCount++;
          results.push({ 
            user_id: user.id, 
            success: true, 
            phone: metadataPhone 
          });
        }
      } else {
        console.log(`Profile for ${user.id} already has phone: ${profile?.phone}`);
        results.push({ 
          user_id: user.id, 
          success: true, 
          phone: profile?.phone,
          skipped: 'already_has_phone' 
        });
      }
    } else {
      console.log(`No phone number in metadata for user ${user.id}`);
      results.push({ 
        user_id: user.id, 
        success: true, 
        skipped: 'no_phone_in_metadata' 
      });
    }
    
    console.log(`Migration completed. Updated ${migratedCount} profiles.`);
    
    return {
      success: true,
      migrated_count: migratedCount,
      total_processed: results.length,
      results,
      note: "Migration limited to current user session due to security restrictions"
    };
    
  } catch (error: any) {
    console.error("Error migrating phone numbers:", error);
    return { success: false, error: error.message };
  }
};

// Helper function to trigger professional registration for existing users
export const triggerProfessionalRegistration = async (userId: string, phone?: string) => {
  try {
    console.log("=== TRIGGERING PROFESSIONAL REGISTRATION ===");
    console.log("User ID:", userId);
    console.log("Phone:", phone);
    
    const { data: result, error } = await supabase.functions.invoke(
      'complete-professional-registration',
      {
        body: {
          user_id: userId,
          phone: phone
        }
      }
    );
    
    if (error) {
      console.error("Error triggering professional registration:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Professional registration triggered successfully:", result);
    return result;
    
  } catch (error: any) {
    console.error("Error triggering professional registration:", error);
    return { success: false, error: error.message };
  }
};

// Helper function to check if user needs professional registration
export const checkProfessionalRegistrationStatus = async (userId: string) => {
  try {
    console.log("=== CHECKING PROFESSIONAL REGISTRATION STATUS ===");
    console.log("User ID:", userId);
    
    // Get user role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (roleError) {
      console.error("Error fetching user role:", roleError);
      return { success: false, error: roleError.message };
    }
    
    // Only check for doctors and nutritionists
    if (!userRole || !['doctor', 'nutritionist'].includes(userRole.role)) {
      return { 
        success: true, 
        needs_registration: false, 
        reason: 'Not a professional user' 
      };
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('registration_status, registration_completed_at')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return { success: false, error: profileError.message };
    }
    
    // Check if registration is complete
    const needsRegistration = profile.registration_status === 'payment_pending' || 
                             profile.registration_status === null ||
                             !profile.registration_completed_at;
    
    return {
      success: true,
      needs_registration: needsRegistration,
      current_status: profile.registration_status,
      role: userRole.role,
      registration_completed_at: profile.registration_completed_at
    };
    
  } catch (error: any) {
    console.error("Error checking professional registration status:", error);
    return { success: false, error: error.message };
  }
};
