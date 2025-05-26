
import { supabase } from '@/integrations/supabase/client';
import type { OtpVerificationResult, FunctionInvokeResult } from '../types';

export const sendOtpToPhone = async (phoneNumber: string): Promise<void> => {
  if (!phoneNumber) {
    throw new Error('Please enter your phone number');
  }
  
  console.log('[SMS OTP] Sending OTP to:', phoneNumber);
  
  const normalizedPhone: string = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
  
  const result: FunctionInvokeResult = await supabase.functions.invoke('send-password-reset-sms', {
    body: { phoneNumber: normalizedPhone }
  });
  
  if (result.error) {
    throw new Error(result.error.message || 'Failed to send OTP');
  }

  if (result.data?.error) {
    throw new Error(result.data.error);
  }
  
  console.log('[SMS OTP] OTP sent successfully');
};

export const verifyOtpCode = async (phoneNumber: string, otp: string): Promise<OtpVerificationResult> => {
  console.log('[SMS OTP] Verifying OTP:', otp);
  
  const normalizedPhone: string = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
  
  const result: FunctionInvokeResult = await supabase.functions.invoke('verify-password-reset-otp', {
    body: { 
      phoneNumber: normalizedPhone,
      otp 
    }
  });
  
  if (result.error) {
    throw new Error(result.error.message || 'Invalid OTP');
  }

  // Check if the function returned an error (including 404 for no user found)
  if (result.data?.error) {
    if (result.data.error.includes('No account found') || result.data.error.includes('Please enter your email')) {
      return { needsEmailConfirmation: true };
    }
    throw new Error(result.data.error);
  }
  
  console.log('[SMS OTP] OTP verified successfully');
  return { 
    sessionToken: result.data.sessionToken, 
    needsEmailConfirmation: false 
  };
};

// Helper function using edge function
const getUserIdByEmailRPC = async (email: string): Promise<string> => {
  try {
    // Use edge function to get user ID to avoid complex table queries
    const { data, error } = await supabase.functions.invoke('verify-users-exist', {
      body: { emails: [email] }
    });
    
    if (error) {
      throw new Error('No account found with this email address. Please check your email or create a new account.');
    }
    
    if (!data || !data.users || data.users.length === 0) {
      throw new Error('No account found with this email address. Please check your email or create a new account.');
    }
    
    return data.users[0].id;
  } catch (error: any) {
    console.error('Error getting user ID:', error);
    throw new Error('Failed to lookup user account. Please try again.');
  }
};

// Simplified helper function using direct table update
const updateUserPhoneRPC = async (userId: string, phoneNumber: string): Promise<void> => {
  try {
    // Use a direct update with explicit any typing to avoid query builder
    const updateResult = await (supabase as any)
      .from('profiles')
      .update({ phone: phoneNumber })
      .eq('id', userId);
    
    if (updateResult.error) {
      console.error('Phone update error:', updateResult.error);
      throw new Error('Failed to link phone number to your account. Please try again.');
    }
  } catch (error: any) {
    console.error('Error updating phone:', error);
    throw new Error('Failed to link phone number to your account. Please try again.');
  }
};

export const linkPhoneToEmail = async (email: string, phoneNumber: string, otp: string): Promise<string> => {
  console.log('[SMS OTP] Attempting to link phone number to email:', email);
  
  try {
    const normalizedPhone: string = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    // Step 1: Get user ID using edge function instead of table query
    const userId = await getUserIdByEmailRPC(email);
    
    // Step 2: Update phone number using simplified approach
    await updateUserPhoneRPC(userId, normalizedPhone);
    
    // Step 3: Verify OTP - reuse the existing function
    const otpResult = await verifyOtpCode(normalizedPhone, otp);
    
    if (!otpResult.sessionToken) {
      throw new Error('Failed to get session token after linking account');
    }
    
    console.log('[SMS OTP] Phone number linked and OTP verified successfully');
    return otpResult.sessionToken;
    
  } catch (error: any) {
    console.error('[SMS OTP] Error in linkPhoneToEmail:', error);
    throw new Error(error.message || 'Failed to link phone number to account');
  }
};

export const updatePasswordWithToken = async (sessionToken: string, newPassword: string): Promise<void> => {
  console.log('[SMS OTP] Updating password');
  
  const result: FunctionInvokeResult = await supabase.functions.invoke('update-password-with-sms-token', {
    body: { 
      sessionToken,
      newPassword 
    }
  });
  
  if (result.error) {
    throw new Error(result.error.message || 'Failed to update password');
  }

  if (result.data?.error) {
    throw new Error(result.data.error);
  }
  
  console.log('[SMS OTP] Password updated successfully');
};
