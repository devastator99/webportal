
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

export const linkPhoneToEmail = async (email: string, phoneNumber: string, otp: string): Promise<string> => {
  console.log('[SMS OTP] Attempting to link phone number to email:', email);
  
  try {
    const normalizedPhone: string = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    // Step 1: Find user profile by email - use simplified approach to avoid type issues
    let userId: string;
    
    try {
      // Use a simplified query approach to avoid deep type inference
      const profileQuery = supabase.from('profiles');
      const selectQuery = profileQuery.select('id');
      const emailQuery = selectQuery.eq('email', email);
      const finalQuery = emailQuery.limit(1);
      
      const { data: profiles, error: profileError } = await finalQuery;
      
      if (profileError) {
        console.error('Profile query error:', profileError);
        throw new Error('Database error occurred while looking up account');
      }
      
      if (!profiles || profiles.length === 0) {
        throw new Error('No account found with this email address. Please check your email or create a new account.');
      }
      
      // Type assertion to avoid inference issues
      userId = (profiles[0] as { id: string }).id;
      
    } catch (queryError: any) {
      console.error('Error finding user profile:', queryError);
      if (queryError.message.includes('No account found')) {
        throw queryError;
      }
      throw new Error('Failed to lookup user account. Please try again.');
    }
    
    // Step 2: Update phone number - use simplified approach
    try {
      const updateQuery = supabase.from('profiles');
      const updateOperation = updateQuery.update({ phone: normalizedPhone });
      const whereClause = updateOperation.eq('id', userId);
      
      const { error: updateError } = await whereClause;
      
      if (updateError) {
        console.error('Phone update error:', updateError);
        throw new Error('Failed to link phone number to your account. Please try again.');
      }
    } catch (updateErr: any) {
      console.error('Error updating phone:', updateErr);
      throw new Error('Failed to link phone number to your account. Please try again.');
    }
    
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
