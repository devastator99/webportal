
import { supabase } from '@/integrations/supabase/client';

export const sendOtpToPhone = async (phoneNumber: string): Promise<void> => {
  if (!phoneNumber) {
    throw new Error('Please enter your phone number');
  }
  
  console.log('[SMS OTP] Sending OTP to:', phoneNumber);
  
  const { data, error } = await supabase.functions.invoke('send-password-reset-sms', {
    body: { 
      phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`
    }
  });
  
  if (error) {
    throw new Error(error.message || 'Failed to send OTP');
  }

  if (data?.error) {
    throw new Error(data.error);
  }
  
  console.log('[SMS OTP] OTP sent successfully');
};

export const verifyOtpCode = async (phoneNumber: string, otp: string) => {
  console.log('[SMS OTP] Verifying OTP:', otp);
  
  const { data, error } = await supabase.functions.invoke('verify-password-reset-otp', {
    body: { 
      phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`,
      otp 
    }
  });
  
  if (error) {
    throw new Error(error.message || 'Invalid OTP');
  }

  if (data?.error) {
    if (data.error.includes('No account found') || data.error.includes('No user found')) {
      return { needsEmailConfirmation: true };
    }
    throw new Error(data.error);
  }
  
  console.log('[SMS OTP] OTP verified successfully');
  return { sessionToken: data.sessionToken, needsEmailConfirmation: false };
};

export const linkPhoneToEmail = async (email: string, phoneNumber: string, otp: string): Promise<string> => {
  console.log('[SMS OTP] Attempting to link phone number to email:', email);
  
  // Step 1: Find user profile by email with explicit typing
  const profileQuery = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email);
  
  // Check if profile exists
  if (profileQuery.error || !profileQuery.data || profileQuery.data.length === 0) {
    throw new Error('No account found with this email address. Please check your email or create a new account.');
  }
  
  const userId = profileQuery.data[0].id;
  
  // Step 2: Update phone number with explicit error handling
  const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
  const updateResult = await supabase
    .from('profiles')
    .update({ phone: normalizedPhone })
    .eq('id', userId);
  
  if (updateResult.error) {
    throw new Error('Failed to link phone number to your account. Please try again.');
  }
  
  // Step 3: Verify OTP with explicit response handling
  try {
    const otpResponse = await supabase.functions.invoke('verify-password-reset-otp', {
      body: { 
        phoneNumber: normalizedPhone,
        otp 
      }
    });
    
    if (otpResponse.error) {
      throw new Error(otpResponse.error.message || 'Failed to verify OTP after linking account');
    }

    if (otpResponse.data?.error) {
      throw new Error(otpResponse.data.error);
    }
    
    console.log('[SMS OTP] Phone number linked and OTP verified successfully');
    return otpResponse.data.sessionToken;
  } catch (err: any) {
    throw new Error(err.message || 'Failed to verify OTP after linking account');
  }
};

export const updatePasswordWithToken = async (sessionToken: string, newPassword: string): Promise<void> => {
  console.log('[SMS OTP] Updating password');
  
  const { data, error } = await supabase.functions.invoke('update-password-with-sms-token', {
    body: { 
      sessionToken,
      newPassword 
    }
  });
  
  if (error) {
    throw new Error(error.message || 'Failed to update password');
  }

  if (data?.error) {
    throw new Error(data.error);
  }
  
  console.log('[SMS OTP] Password updated successfully');
};
