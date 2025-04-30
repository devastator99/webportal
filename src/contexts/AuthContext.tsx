import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import AuthService, { UserRole } from '@/services/AuthService';
import { useNavigate } from 'react-router-dom';

// Define UserRole enum for value references (keep existing enum)
export enum UserRoleEnum {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  NUTRITIONIST = 'nutritionist',
  ADMINISTRATOR = 'administrator',
  RECEPTION = 'reception'
}

// Re-export UserRole type
export type { UserRole };

// Helper function to handle doctor redirects
export const redirectFixForDoctor = (): string => {
  // This function helps ensure doctors are sent to the right dashboard
  return '/dashboard';
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  isLoading: boolean;
  isSigningOut: boolean;
  signOut: () => Promise<void>;
  forceSignOut: () => Promise<void>;
  resetInactivityTimer: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userRole: null,
  isLoading: true,
  isSigningOut: false,
  signOut: async () => {},
  forceSignOut: async () => {},
  resetInactivityTimer: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authServiceRef = useRef<AuthService>(AuthService.getInstance());
  const authStateInitializedRef = useRef(false);
  
  // Initialize auth state only once
  useEffect(() => {
    if (authStateInitializedRef.current) return;
    
    console.log("Initializing auth state");
    authStateInitializedRef.current = true;
    
    // Initialize auth service with state setters
    authServiceRef.current.initializeAuth(
      setUser, 
      setSession, 
      setUserRole, 
      setIsLoading
    );
    
    // Clean up on unmount
    return () => {
      authServiceRef.current.cleanup();
    };
  }, []);
  
  // Set up inactivity timer whenever user changes
  useEffect(() => {
    if (user) {
      authServiceRef.current.setupInactivityTimer(signOut);
    }
  }, [user]);
  
  // Reset inactivity timer - memoized through the ref to prevent unnecessary re-renders
  const resetInactivityTimer = () => {
    if (user) {
      authServiceRef.current.resetInactivityTimer(signOut);
    }
  };
  
  // IMPROVED Sign out function with proper transaction handling
  const signOut = async () => {
    try {
      await authServiceRef.current.signOut();
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };
  
  // Force sign out (for admins)
  const forceSignOut = async () => {
    try {
      await authServiceRef.current.signOut(true);
    } catch (error) {
      console.error("Error during force sign out:", error);
      throw error;
    }
  };
  
  const value = {
    user,
    session,
    userRole,
    isLoading,
    isSigningOut: authServiceRef.current.isSigningOut(),
    signOut,
    forceSignOut,
    resetInactivityTimer
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a hook for easy context use
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
