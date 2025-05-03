import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import AuthService, { UserRole } from '@/services/AuthService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
  
  // Setup cross-tab signout listener
  useEffect(() => {
    // Listen for signout events from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth_signout_broadcast' && user) {
        console.log('Received sign-out broadcast from another tab');
        // Perform local signout without redirecting
        setUser(null);
        setSession(null);
        setUserRole(null);
        // Show notification
        toast.info('Signed out in another tab');
      }
    };

    // Listen for BroadcastChannel if available
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('auth_signout_channel');
      bc.onmessage = (event) => {
        if (event.data === 'signout' && user) {
          console.log('Received sign-out broadcast via BroadcastChannel');
          // Perform local signout without redirecting
          setUser(null);
          setSession(null);
          setUserRole(null);
          // Show notification
          toast.info('Signed out in another tab');
        }
      };
    }

    // Add storage event listener for browsers without BroadcastChannel
    window.addEventListener('storage', handleStorageChange);

    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (bc) bc.close();
    };
  }, [user]);
  
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
      
      // Add activity listeners to reset timer
      const handleActivity = () => resetInactivityTimer();
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('touchstart', handleActivity);
      window.addEventListener('click', handleActivity);
      
      return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('touchstart', handleActivity);
        window.removeEventListener('click', handleActivity);
      };
    }
  }, [user]);
  
  // Reset inactivity timer - memoized through the ref to prevent unnecessary re-renders
  const resetInactivityTimer = useCallback(() => {
    if (user) {
      authServiceRef.current.resetInactivityTimer(signOut);
    }
  }, [user]);
  
  // IMPROVED Sign out function with proper transaction handling
  const signOut = useCallback(async () => {
    try {
      await authServiceRef.current.signOut();
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  }, []);
  
  // Force sign out (for admins)
  const forceSignOut = useCallback(async () => {
    try {
      await authServiceRef.current.signOut(true);
    } catch (error) {
      console.error("Error during force sign out:", error);
      throw error;
    }
  }, []);
  
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
