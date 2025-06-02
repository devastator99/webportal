
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useManualRegistrationTrigger = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const triggerProfessionalRegistration = async (userId: string, userPhone?: string) => {
    setLoading(true);
    try {
      console.log('Manually triggering professional registration for user:', userId);

      // First, get user details including phone
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', userId)
        .single();

      if (profileError || !userProfile) {
        throw new Error('Failed to get user profile');
      }

      const finalPhone = userPhone || userProfile.phone;
      
      if (!finalPhone) {
        throw new Error('Phone number is required for registration');
      }

      // Trigger the professional registration edge function directly
      const { data: result, error } = await supabase.functions.invoke(
        'complete-professional-registration',
        {
          body: {
            user_id: userId,
            phone: finalPhone
          }
        }
      );

      if (error) {
        console.error('Professional registration failed:', error);
        throw new Error(error.message || 'Professional registration failed');
      }

      console.log('Professional registration triggered successfully:', result);

      toast({
        title: 'Registration Triggered',
        description: `Professional registration completed successfully. Notifications should be sent to ${finalPhone}.`,
      });

      return result;
    } catch (error: any) {
      console.error('Error triggering professional registration:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to trigger professional registration',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fixExistingUsers = async () => {
    setLoading(true);
    try {
      console.log('Fixing existing professional users...');

      // Call the database function to fix existing users
      const { data: fixResult, error: fixError } = await supabase.rpc('fix_existing_professional_users');

      if (fixError) {
        throw new Error(fixError.message || 'Failed to fix existing users');
      }

      console.log('Fix existing users result:', fixResult);

      // Now trigger the process-registration-tasks function to process pending tasks
      const { data: processResult, error: processError } = await supabase.functions.invoke(
        'process-registration-tasks',
        { body: {} }
      );

      if (processError) {
        console.error('Failed to process registration tasks:', processError);
        // Don't throw here as the fix might have worked
      }

      toast({
        title: 'Users Fixed',
        description: `Fixed ${fixResult?.users_fixed || 0} users and created ${fixResult?.tasks_created || 0} tasks.`,
      });

      return fixResult;
    } catch (error: any) {
      console.error('Error fixing existing users:', error);
      toast({
        title: 'Fix Failed',
        description: error.message || 'Failed to fix existing users',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    triggerProfessionalRegistration,
    fixExistingUsers,
    loading
  };
};
