
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

// Helper function to check if user exists via RPC
const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error }: any = await supabase.rpc('check_user_exists', {
      p_email: email
    });
    
    if (error) {
      console.error('User check error:', error);
      throw new Error('Database error occurred while looking up account');
    }
    
    return Boolean(data);
  } catch (error: any) {
    console.error('Error in checkUserExists:', error);
    throw new Error('Failed to check user existence');
  }
};

// Helper function to get user ID by email via direct query with explicit typing
const getUserIdByEmail = async (email: string): Promise<string> => {
  try {
    // Use explicit any typing to avoid type instantiation issues
    const result: any = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1)
      .single();
    
    if (result.error || !result.data) {
      throw new Error('No account found with this email address. Please check your email or create a new account.');
    }
    
    return result.data.id;
  } catch (error: any) {
    console.error('Error getting user ID:', error);
    throw new Error('Failed to lookup user account. Please try again.');
  }
};

// Helper function to update phone number with explicit typing
const updateUserPhone = async (userId: string, phoneNumber: string): Promise<void> => {
  try {
    // Use explicit any typing to avoid type instantiation issues
    const result: any = await supabase
      .from('profiles')
      .update({ phone: phoneNumber })
      .eq('id', userId);
    
    if (result.error) {
      console.error('Phone update error:', result.error);
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
    
    // Step 1: Check if user exists using RPC
    const userExists = await checkUserExists(email);
    if (!userExists) {
      throw new Error('No account found with this email address. Please check your email or create a new account.');
    }
    
    // Step 2: Get user ID
    const userId = await getUserIdByEmail(email);
    
    // Step 3: Update phone number
    await updateUserPhone(userId, normalizedPhone);
    
    // Step 4: Verify OTP - reuse the existing function
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
