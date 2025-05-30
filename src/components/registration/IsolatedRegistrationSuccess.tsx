
import React from 'react';
import { RegistrationSuccess } from '@/components/registration/RegistrationSuccess';
import { useRegistration } from '@/contexts/RegistrationContext';
import { useNavigate } from 'react-router-dom';

export const IsolatedRegistrationSuccess: React.FC = () => {
  const { userType, signOut, clearState } = useRegistration();
  const navigate = useNavigate();

  const handleSuccessComplete = async () => {
    console.log("IsolatedRegistrationSuccess: Registration complete, signing out user and clearing state");
    
    try {
      // Clear registration state first
      clearState();
      
      // Sign out the user
      await signOut();
      
      // Navigate to auth page
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("IsolatedRegistrationSuccess: Error completing registration:", error);
      // Still navigate even if there's an error
      navigate("/auth", { replace: true });
    }
  };

  return (
    <RegistrationSuccess 
      userType={userType}
      onComplete={handleSuccessComplete}
    />
  );
};
