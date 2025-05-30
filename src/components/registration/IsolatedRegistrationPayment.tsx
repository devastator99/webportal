
import React from 'react';
import { RegistrationPayment } from '@/components/auth/RegistrationPayment';
import { useRegistration } from '@/contexts/RegistrationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const IsolatedRegistrationPayment: React.FC = () => {
  const { user, userInfo, setStep } = useRegistration();

  const handlePaymentComplete = async () => {
    console.log("IsolatedRegistrationPayment: Payment completed, triggering backend tasks");
    setStep(3);
    
    try {
      // Trigger backend processing for patient registration
      if (user?.id) {
        const { error } = await supabase.functions.invoke('trigger-registration-notifications', {
          body: { patient_id: user.id }
        });
        
        if (error) {
          console.error("IsolatedRegistrationPayment: Error triggering backend tasks:", error);
        } else {
          console.log("IsolatedRegistrationPayment: Backend registration tasks triggered successfully");
        }
      }
    } catch (error) {
      console.error("IsolatedRegistrationPayment: Exception triggering backend tasks:", error);
    }
    
    toast({
      title: "Payment Complete!",
      description: "Your registration is being processed. Check your email/SMS for login instructions.",
    });
  };

  return (
    <RegistrationPayment 
      onComplete={handlePaymentComplete}
      userInfo={userInfo}
    />
  );
};
