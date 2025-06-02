
import { supabase } from '@/integrations/supabase/client';

export const checkDoctorProfileComplete = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, specialty')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking doctor profile:', error);
      return false;
    }

    // Check if all required fields are present
    return !!(data?.first_name && data?.last_name && data?.phone && data?.specialty);
  } catch (error) {
    console.error('Exception checking doctor profile:', error);
    return false;
  }
};

export const checkNutritionistProfileComplete = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, specialty')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking nutritionist profile:', error);
      return false;
    }

    // Check if all required fields are present
    return !!(data?.first_name && data?.last_name && data?.phone && data?.specialty);
  } catch (error) {
    console.error('Exception checking nutritionist profile:', error);
    return false;
  }
};
