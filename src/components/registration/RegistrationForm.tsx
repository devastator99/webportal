
import React, { useState } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';

interface RegistrationFormProps {
  onSubmit: (
    email: string,
    password: string,
    userType?: string,
    firstName?: string,
    lastName?: string,
    patientData?: any
  ) => Promise<void>;
  error: string | null;
  loading: boolean;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSubmit,
  error,
  loading
}) => {
  return (
    <AuthForm
      type="register"
      onSubmit={onSubmit}
      error={error}
      loading={loading}
    />
  );
};
