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

// Helper function to get user ID by email using direct profile lookup
const getUserIdByEmail = async (email: string): Promise<string> => {
  try {
    console.log('[SMS OTP] Looking up user by email in profiles:', email);
    
    // First, check if the user exists in auth.users through a safe approach
    const { data: userCheck, error: checkError } = await supabase
      .rpc('check_user_exists', { p_email: email.toLowerCase().trim() });
    
    if (checkError) {
      console.error('[SMS OTP] User existence check error:', checkError);
      throw new Error('Failed to verify user account. Please try again.');
    }
    
    if (!userCheck) {
      throw new Error('No account found with this email address. Please check your email or create a new account.');
    }
    
    // If user exists in auth, try to find their profile
    // We'll use a different approach since we can't directly query auth.users
    // Instead, we'll create the profile entry if it doesn't exist
    
    // For now, let's use a simpler approach - ask user to contact support
    // since we need the actual user ID from auth.users
    throw new Error('Account verification required. Please contact support to link your phone number to your email account.');
    
  } catch (error: any) {
    console.error('[SMS OTP] Error getting user ID:', error);
    throw new Error(error.message || 'Failed to lookup user account. Please try again.');
  }
};

// Helper function to update user phone using RPC call
const updateUserPhone = async (userId: string, phoneNumber: string): Promise<void> => {
  try {
    console.log('[SMS OTP] Updating user phone via edge function for user:', userId);
    
    // Call the upsert-patient-details edge function to update phone
    const { data, error } = await supabase.functions.invoke('upsert-patient-details', {
      body: { 
        patientId: userId,
        emergencyContact: phoneNumber  // Store phone in emergency_contact field
      }
    });
    
    if (error) {
      console.error('[SMS OTP] Phone update RPC error:', error);
      throw new Error('Failed to link phone number to your account. Please try again.');
    }
    
    if (data?.error) {
      console.error('[SMS OTP] Phone update function returned error:', data.error);
      throw new Error('Failed to link phone number to your account. Please try again.');
    }
    
    console.log('[SMS OTP] Phone updated successfully via RPC');
  } catch (error: any) {
    console.error('[SMS OTP] Error updating phone:', error);
    throw new Error(error.message || 'Failed to link phone number to your account. Please try again.');
  }
};

export const linkPhoneToEmail = async (email: string, phoneNumber: string, otp: string): Promise<string> => {
  console.log('[SMS OTP] Attempting to link phone number to email:', email);
  
  try {
    // For now, provide a user-friendly message about the limitation
    throw new Error('Phone-to-email linking is currently unavailable. Please contact support for assistance with linking your phone number to your account.');
    
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
