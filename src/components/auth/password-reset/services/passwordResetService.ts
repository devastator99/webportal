
import { supabase } from "@/integrations/supabase/client";
import { findUserByPhone } from "@/utils/registrationVerification";

export const sendSmsOtp = async (phoneNumber: string): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log("=== SENDING SMS OTP ===");
    console.log("Phone number input:", phoneNumber);
    
    // First verify the user exists in our database
    const userLookup = await findUserByPhone(phoneNumber);
    
    if (!userLookup.success) {
      console.error("User lookup failed:", userLookup.error);
      return {
        success: false,
        message: `No account found with phone number ${phoneNumber}. Please check the number or register first.`
      };
    }
    
    console.log("User found, proceeding with SMS OTP");
    
    // Use the normalized phone number
    const normalizedPhone = userLookup.phone_normalized;
    
    const { data, error } = await supabase.functions.invoke('send-sms-otp', {
      body: { 
        phone: normalizedPhone,
        type: 'password_reset'
      }
    });

    console.log("SMS OTP function response:", { data, error });

    if (error) {
      console.error("SMS OTP function error:", error);
      return {
        success: false,
        message: error.message || 'Failed to send SMS OTP'
      };
    }

    if (!data?.success) {
      console.error("SMS OTP function returned failure:", data);
      return {
        success: false,
        message: data?.error || 'Failed to send SMS OTP'
      };
    }

    console.log("SMS OTP sent successfully");
    return {
      success: true,
      message: 'OTP sent successfully to your phone number'
    };

  } catch (error: any) {
    console.error("Exception in sendSmsOtp:", error);
    return {
      success: false,
      message: 'An unexpected error occurred while sending OTP'
    };
  }
};

export const verifySmsOtp = async (phoneNumber: string, otp: string): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log("=== VERIFYING SMS OTP ===");
    console.log("Phone number:", phoneNumber);
    console.log("OTP:", otp);
    
    // First verify the user exists
    const userLookup = await findUserByPhone(phoneNumber);
    
    if (!userLookup.success) {
      console.error("User lookup failed during verification:", userLookup.error);
      return {
        success: false,
        message: 'Invalid phone number or OTP'
      };
    }
    
    // Use the normalized phone number
    const normalizedPhone = userLookup.phone_normalized;
    
    const { data, error } = await supabase.functions.invoke('verify-sms-otp', {
      body: { 
        phone: normalizedPhone,
        otp: otp.trim(),
        type: 'password_reset'
      }
    });

    console.log("SMS OTP verification response:", { data, error });

    if (error) {
      console.error("SMS OTP verification error:", error);
      return {
        success: false,
        message: error.message || 'Failed to verify OTP'
      };
    }

    if (!data?.success) {
      console.error("SMS OTP verification failed:", data);
      return {
        success: false,
        message: data?.error || 'Invalid or expired OTP'
      };
    }

    console.log("SMS OTP verified successfully");
    return {
      success: true,
      message: 'OTP verified successfully'
    };

  } catch (error: any) {
    console.error("Exception in verifySmsOtp:", error);
    return {
      success: false,
      message: 'An unexpected error occurred while verifying OTP'
    };
  }
};

export const resetPasswordWithPhone = async (phoneNumber: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log("=== RESETTING PASSWORD WITH PHONE ===");
    console.log("Phone number:", phoneNumber);
    
    // First verify the user exists
    const userLookup = await findUserByPhone(phoneNumber);
    
    if (!userLookup.success) {
      console.error("User lookup failed during password reset:", userLookup.error);
      return {
        success: false,
        message: 'Invalid phone number'
      };
    }
    
    const userId = userLookup.user.id;
    console.log("Found user ID:", userId);
    
    // Use the normalized phone number
    const normalizedPhone = userLookup.phone_normalized;
    
    const { data, error } = await supabase.functions.invoke('reset-password-with-phone', {
      body: { 
        phone: normalizedPhone,
        newPassword: newPassword,
        userId: userId
      }
    });

    console.log("Password reset response:", { data, error });

    if (error) {
      console.error("Password reset error:", error);
      return {
        success: false,
        message: error.message || 'Failed to reset password'
      };
    }

    if (!data?.success) {
      console.error("Password reset failed:", data);
      return {
        success: false,
        message: data?.error || 'Failed to reset password'
      };
    }

    console.log("Password reset successfully");
    return {
      success: true,
      message: 'Password reset successfully'
    };

  } catch (error: any) {
    console.error("Exception in resetPasswordWithPhone:", error);
    return {
      success: false,
      message: 'An unexpected error occurred while resetting password'
    };
  }
};

// Add the missing email-related functions that usePasswordResetActions expects
export const sendOtpToPhone = sendSmsOtp;

export const sendOtpToEmail = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/update-password`,
  });
  
  if (error) {
    throw new Error(error.message);
  }
};

export const verifyOtpCode = async (contact: string, otp: string, method: 'sms' | 'email'): Promise<{ needsEmailConfirmation?: boolean; sessionToken?: string }> => {
  if (method === 'sms') {
    const result = await verifySmsOtp(contact, otp);
    if (result.success) {
      return { sessionToken: 'sms_verified' };
    } else {
      throw new Error(result.message);
    }
  } else {
    // For email OTP verification
    const { error } = await supabase.auth.verifyOtp({
      email: contact,
      token: otp,
      type: 'email'
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { sessionToken: 'email_verified' };
  }
};

export const linkPhoneToEmail = async (email: string, phoneNumber: string, otp: string): Promise<string> => {
  // This would be implemented if we need to link phone to existing email account
  throw new Error('Phone to email linking not implemented yet');
};

export const updatePasswordWithToken = async (sessionToken: string, newPassword: string): Promise<void> => {
  if (sessionToken === 'sms_verified' || sessionToken === 'email_verified') {
    const { error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });
    
    if (error) {
      throw new Error(error.message);
    }
  } else {
    throw new Error('Invalid session token');
  }
};
