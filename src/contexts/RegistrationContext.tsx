
import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface RegistrationState {
  step: number;
  userType: string | null;
  userInfo: any;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface RegistrationContextType extends RegistrationState {
  setStep: (step: number) => void;
  setUserType: (type: string) => void;
  setUserInfo: (info: any) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signOut: () => Promise<void>;
  clearState: () => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signOut = useCallback(async () => {
    try {
      console.log("Registration: Signing out user");
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Registration signout error:", error);
    }
  }, []);

  const clearState = useCallback(() => {
    console.log("Registration: Clearing all state");
    setStep(1);
    setUserType(null);
    setUserInfo(null);
    setUser(null);
    setLoading(false);
    setError(null);
  }, []);

  const value = {
    step,
    userType,
    userInfo,
    user,
    isLoading,
    error,
    setStep,
    setUserType,
    setUserInfo,
    setUser,
    setLoading,
    setError,
    signOut,
    clearState
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};
