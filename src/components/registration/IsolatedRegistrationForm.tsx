
import React from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { useRegistration } from '@/contexts/RegistrationContext';
import { useRegistrationAuth } from '@/hooks/useRegistrationAuth';

export const IsolatedRegistrationForm: React.FC = () => {
  const { setUserType, setUserInfo, setUser, setStep } = useRegistration();
  const { handleRegistration, loading, error } = useRegistrationAuth();

  const onSubmit = async (
    email: string,
    password: string,
    userType?: string,
    firstName?: string,
    lastName?: string,
    patientData?: any
  ) => {
    try {
      console.log("IsolatedRegistrationForm: Form submission started:", { userType });
      
      setUserType(userType!);
      setUserInfo({ firstName, lastName, email });
      
      // Create user with role for all user types
      const newUser = await handleRegistration(
        email,
        password,
        userType as any,
        firstName,
        lastName,
        patientData,
        false // Don't skip role creation for any user type
      );
      
      if (newUser) {
        console.log("IsolatedRegistrationForm: User created successfully:", newUser.id, "UserType:", userType);
        setUser(newUser);
        
        if (userType === 'patient') {
          console.log("IsolatedRegistrationForm: Patient account created, moving to payment step");
          setStep(2);
        } else {
          console.log("IsolatedRegistrationForm: Non-patient account created, showing success");
          setStep(3);
        }
      } else {
        throw new Error("Failed to create user account");
      }
    } catch (error: any) {
      console.error("IsolatedRegistrationForm: Registration error:", error);
      throw error;
    }
  };

  return (
    <AuthForm
      type="register"
      onSubmit={onSubmit}
      error={error}
      loading={loading}
    />
  );
};
