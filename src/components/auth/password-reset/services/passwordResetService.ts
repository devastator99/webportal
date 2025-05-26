
import { supabase } from '@/integrations/supabase/client';
import type { OtpVerificationResult, SupabaseQueryResult, ProfileData, FunctionInvokeResult } from './types';

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

  if (result.data?.error) {
    if (result.data.error.includes('No account found') || result.data.error.includes('No user found')) {
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

export const linkPhoneToEmail = async (email: string, phoneNumber: string, otp: string): Promise<string> => {
  console.log('[SMS OTP] Attempting to link phone number to email:', email);
  
  try {
    // Step 1: Find user profile by email with explicit typing
    const profileQuery = supabase
      .from('profiles')
      .select('id')
      .eq('email', email);
    
    const profileResult: SupabaseQueryResult<ProfileData[]> = await profileQuery;
    
    if (profileResult.error) {
      throw new Error('Database error occurred while looking up account');
    }
    
    if (!profileResult.data || profileResult.data.length === 0) {
      throw new Error('No account found with this email address. Please check your email or create a new account.');
    }
    
    const userId: string = profileResult.data[0].id;
    const normalizedPhone: string = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    // Step 2: Update phone number with explicit type handling
    const updateQuery = supabase
      .from('profiles')
      .update({ phone: normalizedPhone })
      .eq('id', userId);
    
    const updateResult: SupabaseQueryResult<any> = await updateQuery;
    
    if (updateResult.error) {
      throw new Error('Failed to link phone number to your account. Please try again.');
    }
    
    // Step 3: Verify OTP with explicit result typing
    const otpInvokeResult: FunctionInvokeResult = await supabase.functions.invoke('verify-password-reset-otp', {
      body: { 
        phoneNumber: normalizedPhone,
        otp 
      }
    });
    
    if (otpInvokeResult.error) {
      throw new Error(otpInvokeResult.error.message || 'Failed to verify OTP after linking account');
    }

    if (otpInvokeResult.data?.error) {
      throw new Error(otpInvokeResult.data.error);
    }
    
    console.log('[SMS OTP] Phone number linked and OTP verified successfully');
    return otpInvokeResult.data.sessionToken as string;
    
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
