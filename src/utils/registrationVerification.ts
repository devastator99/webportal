
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
    
    // Also check auth metadata for phone numbers that might not be in profiles yet
    console.log("Checking auth metadata for phone numbers...");
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError && authUsers.users) {
        for (const variant of uniqueVariants) {
          // Fix: Properly type the user parameter to avoid 'never' type
          const userWithPhone = authUsers.users.find((authUser: any) => {
            const metadataPhone = authUser.user_metadata?.phone;
            const primaryContact = authUser.user_metadata?.primary_contact;
            
            return metadataPhone === variant || primaryContact === variant;
          });
          
          if (userWithPhone) {
            console.log("Found user in auth metadata:", userWithPhone.id);
            
            // Get profile and role data
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userWithPhone.id)
              .single();
            
            const { data: userRole } = await supabase
              .from('user_roles')
              .select('*')
              .eq('user_id', userWithPhone.id)
              .single();
            
            const { data: registrationStatus } = await supabase.rpc(
              'get_user_registration_status_safe',
              { p_user_id: userWithPhone.id }
            );
            
            return {
              success: true,
              user: profile || { 
                id: userWithPhone.id, 
                first_name: userWithPhone.user_metadata?.first_name,
                last_name: userWithPhone.user_metadata?.last_name,
                phone: userWithPhone.user_metadata?.phone 
              },
              role: userRole?.role,
              registration_status: registrationStatus,
              phone_normalized: variant,
              phone_variants_checked: uniqueVariants,
              found_in_auth_metadata: true,
              all_database_phones: allProfiles?.map(p => ({ 
                name: `${p.first_name} ${p.last_name}`, 
                phone: p.phone 
              }))
            };
          }
        }
      }
    } catch (metadataError) {
      console.log("Could not check auth metadata:", metadataError);
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

// Helper function to migrate phone numbers from auth metadata to profiles
export const migratePhoneNumbersFromMetadata = async () => {
  try {
    console.log("=== MIGRATING PHONE NUMBERS FROM METADATA ===");
    
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching auth users:", authError);
      return { success: false, error: authError.message };
    }
    
    let migratedCount = 0;
    const results = [];
    
    // Fix: Properly type the user parameter to avoid 'never' type
    for (const authUser of authUsers.users || []) {
      const metadataPhone = (authUser as any).user_metadata?.phone;
      
      if (metadataPhone) {
        console.log(`Checking user ${authUser.id} with metadata phone: ${metadataPhone}`);
        
        // Check if profile already has phone
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', authUser.id)
          .single();
        
        if (!profileError && (!profile?.phone || profile.phone === '')) {
          console.log(`Updating profile for user ${authUser.id} with phone: ${metadataPhone}`);
          
          // Update profile with phone from metadata
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ phone: metadataPhone })
            .eq('id', authUser.id);
          
          if (updateError) {
            console.error(`Error updating profile for ${authUser.id}:`, updateError);
            results.push({ 
              user_id: authUser.id, 
              success: false, 
              error: updateError.message,
              phone: metadataPhone 
            });
          } else {
            console.log(`Successfully updated profile for ${authUser.id}`);
            migratedCount++;
            results.push({ 
              user_id: authUser.id, 
              success: true, 
              phone: metadataPhone 
            });
          }
        } else {
          console.log(`Profile for ${authUser.id} already has phone: ${profile?.phone}`);
          results.push({ 
            user_id: authUser.id, 
            success: true, 
            phone: profile?.phone,
            skipped: 'already_has_phone' 
          });
        }
      }
    }
    
    console.log(`Migration completed. Updated ${migratedCount} profiles.`);
    
    return {
      success: true,
      migrated_count: migratedCount,
      total_processed: results.length,
      results
    };
    
  } catch (error: any) {
    console.error("Error migrating phone numbers:", error);
    return { success: false, error: error.message };
  }
};
