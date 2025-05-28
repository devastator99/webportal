
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://hhzguvddqyzjnqnpsrcv.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhoemd1dmRkcXl6am5xbnBzcmN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5MTY5NDMsImV4cCI6MjA0NzQ5Mjk0M30.2X2yI9RaJI-PLIzNKI5r5nB5g4tIJ-aYdwZUmXmj8Eg"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to create user role safely
export const createUserRole = async (userId: string, role: 'patient' | 'doctor' | 'nutritionist' | 'administrator') => {
  try {
    console.log(`Creating user role for ${userId} with role ${role}`);
    
    const { data, error } = await supabase.rpc('create_user_role', {
      p_user_id: userId,
      p_role: role
    });

    if (error) {
      console.error('Error creating user role:', error);
      throw new Error(`Failed to create user role: ${error.message}`);
    }

    console.log('User role created successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Exception in createUserRole:', error);
    throw new Error(`Failed to create user role: ${error.message}`);
  }
};
