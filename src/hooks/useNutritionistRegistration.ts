
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useNutritionistRegistration() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const triggerNutritionistWelcomeNotification = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive'
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      console.log("Triggering nutritionist welcome notification for:", user.id);
      
      // Get user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error(`Failed to get profile: ${profileError.message}`);
      }

      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      const userEmail = user.email || '';

      // Send comprehensive welcome notification
      const { data, error } = await supabase.functions.invoke('send-comprehensive-welcome-notification', {
        body: {
          patient_id: user.id,
          patient_email: userEmail,
          patient_phone: profile.phone,
          patient_name: fullName,
          patient_details: {
            role: 'nutritionist',
            registration_type: 'professional'
          }
        }
      });

      if (error) {
        throw error;
      }

      console.log("Nutritionist welcome notification result:", data);
      
      toast({
        title: 'Welcome Notification Sent',
        description: 'Welcome email has been sent successfully',
      });
      
      return true;
      
    } catch (error: any) {
      console.error('Error sending nutritionist welcome notification:', error);
      toast({
        title: 'Notification Failed',
        description: error.message || 'Failed to send welcome notification',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    triggerNutritionistWelcomeNotification,
    isLoading
  };
}
