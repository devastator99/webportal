
import { supabase } from '@/integrations/supabase/client';
import type { OtpVerificationResult, FunctionInvokeResult } from '../types';

export const sendOtpToPhone = async (phoneNumber: string): Promise<void> => {
  if (!phoneNumber) {
    throw new Error('Please enter your phone number');
  }
  
  console.log('[SMS OTP] Sending OTP to:', phoneNumber);
  
  const normalizedPhone: string = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
  
  try {
    const result: FunctionInvokeResult = await supabase.functions.invoke('send-password-reset-sms', {
      body: { phoneNumber: normalizedPhone }
    });
    
    if (result.error) {
      console.error('[SMS OTP] Function invoke error:', result.error);
      throw new Error(result.error.message || 'Failed to send OTP');
    }

    if (result.data?.error) {
      console.error('[SMS OTP] Function returned error:', result.data.error);
      throw new Error(result.data.error);
    }
    
    console.log('[SMS OTP] OTP sent successfully');
  } catch (error: any) {
    console.error('[SMS OTP] Send error:', error);
    throw new Error(error.message || 'Failed to send OTP. Please try again.');
  }
};

export const verifyOtpCode = async (phoneNumber: string, otp: string): Promise<OtpVerificationResult> => {
  console.log('[SMS OTP] Verifying OTP:', otp);
  
  const normalizedPhone: string = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
  
  try {
    const result: FunctionInvokeResult = await supabase.functions.invoke('verify-password-reset-otp', {
      body: { 
        phoneNumber: normalizedPhone,
        otp 
      }
    });
    
    console.log('[SMS OTP] Raw function result:', result);
    
    // Handle network/function invoke errors first
    if (result.error) {
      console.error('[SMS OTP] Function invoke error:', result.error);
      throw new Error('Failed to verify OTP. Please check your internet connection and try again.');
    }
    
    // Handle successful response with data
    if (result.data) {
      // Check for successful verification first
      if (result.data.success && result.data.sessionToken) {
        console.log('[SMS OTP] OTP verified successfully');
        return { 
          sessionToken: result.data.sessionToken, 
          needsEmailConfirmation: false 
        };
      }
      
      // Check if phone number is not registered
      if (result.data.phoneNotRegistered) {
        console.log('[SMS OTP] Phone number not registered, email confirmation needed');
        return { 
          needsEmailConfirmation: true,
          phoneNotRegistered: true,
          phoneNumber: result.data.phoneNumber
        };
      }
      
      // Check if it's a general "needs email confirmation" case
      if (result.data.needsEmailConfirmation) {
        console.log('[SMS OTP] Email confirmation needed');
        return { needsEmailConfirmation: true };
      }
      
      // Handle other error cases
      if (result.data.error) {
        console.error('[SMS OTP] Function returned error:', result.data.error);
        throw new Error(result.data.error);
      }
      
      // Handle failed verification
      if (result.data.success === false) {
        console.error('[SMS OTP] Verification failed:', result.data.error || 'Unknown error');
        throw new Error(result.data.error || 'OTP verification failed');
      }
    }
    
    // Unexpected response format
    console.error('[SMS OTP] Unexpected response format:', result);
    throw new Error('Unexpected response from server. Please try again.');
    
  } catch (error: any) {
    console.error('[SMS OTP] Verify error caught:', error);
    
    // Re-throw business logic errors as-is
    throw error;
  }
};

// Helper function to get user ID by email using profiles table
const getUserIdByEmail = async (email: string): Promise<string> => {
  try {
    console.log('[SMS OTP] Looking up user by email in profiles table:', email);
    
    // Add explicit typing to avoid TypeScript infinite recursion
    const { data, error }: { data: { id: string } | null; error: any } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();
    
    if (error) {
      console.error('[SMS OTP] Profile lookup error:', error);
      if (error.code === 'PGRST116') {
        throw new Error('No account found with this email address. Please check your email or create a new account.');
      }
      throw new Error('Failed to lookup user account. Please try again.');
    }
    
    if (!data) {
      throw new Error('No account found with this email address. Please check your email or create a new account.');
    }
    
    console.log('[SMS OTP] User found by email in profiles table');
    return data.id;
    
  } catch (error: any) {
    console.error('[SMS OTP] Error getting user ID:', error);
    throw new Error(error.message || 'Failed to lookup user account. Please try again.');
  }
};

// Helper function to update user phone
const updateUserPhone = async (userId: string, phoneNumber: string): Promise<void> => {
  try {
    console.log('[SMS OTP] Updating user phone for user:', userId);
    
    // Add explicit typing to avoid TypeScript issues
    const { error }: { error: any } = await supabase
      .from('profiles')
      .update({ phone: phoneNumber })
      .eq('id', userId);
    
    if (error) {
      console.error('[SMS OTP] Phone update error:', error);
      throw new Error('Failed to link phone number to your account. Please try again.');
    }
    
    console.log('[SMS OTP] Phone updated successfully');
  } catch (error: any) {
    console.error('[SMS OTP] Error updating phone:', error);
    throw new Error(error.message || 'Failed to link phone number to your account. Please try again.');
  }
};

export const linkPhoneToEmail = async (email: string, phoneNumber: string, otp: string): Promise<string> => {
  console.log('[SMS OTP] Attempting to link phone number to email:', email);
  
  try {
    const normalizedPhone: string = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    // Step 1: Get user ID by email from profiles table
    const userId = await getUserIdByEmail(email);
    
    // Step 2: Update phone number in profiles table
    await updateUserPhone(userId, normalizedPhone);
    
    // Step 3: Verify OTP again - this time it should find the user
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
  
  try {
    const result: FunctionInvokeResult = await supabase.functions.invoke('update-password-with-sms-token', {
      body: { 
        sessionToken,
        newPassword 
      }
    });
    
    if (result.error) {
      console.error('[SMS OTP] Password update function error:', result.error);
      throw new Error(result.error.message || 'Failed to update password');
    }

    if (result.data?.error) {
      console.error('[SMS OTP] Password update returned error:', result.data.error);
      throw new Error(result.data.error);
    }
    
    console.log('[SMS OTP] Password updated successfully');
  } catch (error: any) {
    console.error('[SMS OTP] Password update error:', error);
    throw new Error(error.message || 'Failed to update password. Please try again.');
  }
};
