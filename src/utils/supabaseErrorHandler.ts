
import { PostgrestError } from '@supabase/supabase-js';

export interface SupabaseErrorDetails {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
}

export const handleSupabaseError = (error: PostgrestError | Error | any): SupabaseErrorDetails => {
  console.error('Supabase Error:', error);
  
  // Handle PostgrestError (database errors)
  if (error?.code) {
    return {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message || 'Database operation failed'
    };
  }
  
  // Handle network errors
  if (error?.message?.includes('connect') || error?.message?.includes('network')) {
    return {
      message: 'Network connection error. Please check your internet connection and try again.'
    };
  }
  
  // Handle authentication errors
  if (error?.message?.includes('auth') || error?.message?.includes('unauthorized')) {
    return {
      message: 'Authentication error. Please sign in again.'
    };
  }
  
  // Handle generic errors
  return {
    message: error?.message || 'An unexpected error occurred. Please try again.'
  };
};

export const retrySupabaseOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};
