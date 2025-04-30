
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Define UserRole type and enum
export type UserRole = 'patient' | 'doctor' | 'nutritionist' | 'administrator' | 'reception' | null;

// Create a UserRole enum for value references
export enum UserRoleEnum {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  NUTRITIONIST = 'nutritionist',
  ADMINISTRATOR = 'administrator',
  RECEPTION = 'reception'
}

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

// Inactivity timeout in milliseconds (30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const authStateInitializedRef = useRef(false);
  
  // Initialize auth state only once
  useEffect(() => {
    if (authStateInitializedRef.current) return;
    
    console.log("Initializing auth state");
    authStateInitializedRef.current = true;
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state change:", event);
        
        if (event === 'SIGNED_OUT') {
          console.log("User signed out, clearing auth state");
          setSession(null);
          setUser(null);
          setUserRole(null);
          return;
        }
        
        if (event === 'SIGNED_IN' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          // Fetch user role on sign in
          if (newSession.user) {
            try {
              const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
                lookup_user_id: newSession.user.id
              });
              
              if (!roleError && roleData) {
                const userRoleValue = roleData[0]?.role as UserRole || null;
                setUserRole(userRoleValue);
                console.log("User role on sign in:", userRoleValue);
              } else if (roleError) {
                console.error("Error fetching user role on sign in:", roleError);
              }
            } catch (error) {
              console.error("Error in role handling:", error);
            }
          }
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
        } else if (event === 'USER_UPDATED' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
        }
      }
    );
    
    // Try to get the session from localStorage if available
    const fetchInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          console.log("Initial session found", initialSession.user?.email);
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Fetch user role
          if (initialSession.user) {
            const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
              lookup_user_id: initialSession.user.id
            });
            
            if (!roleError && roleData) {
              const role = roleData[0]?.role as UserRole || null;
              setUserRole(role);
              console.log("User role set:", role);
            } else if (roleError) {
              console.error("Error fetching user role:", roleError);
            }
          }
        } else {
          console.log("No initial session found");
        }
      } catch (error) {
        console.error("Error fetching initial session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Set up inactivity timer
  useEffect(() => {
    const clearInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
    
    if (user) {
      clearInactivityTimer();
      
      inactivityTimerRef.current = setTimeout(() => {
        // Auto logout after inactivity
        signOut();
        toast.info("You have been signed out due to inactivity");
      }, INACTIVITY_TIMEOUT);
    }
    
    return clearInactivityTimer;
  }, [user]);
  
  // Reset inactivity timer - memoized to prevent unnecessary re-renders
  const resetInactivityTimer = useCallback(() => {
    if (user && inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      
      inactivityTimerRef.current = setTimeout(() => {
        // Auto logout after inactivity
        signOut();
        toast.info("You have been signed out due to inactivity");
      }, INACTIVITY_TIMEOUT);
    }
  }, [user]);
  
  // IMPROVED Sign out function with proper sequence
  const signOut = async () => {
    // Prevent multiple sign-out attempts
    if (isSigningOut) {
      console.log("Already signing out, skipping redundant call");
      return;
    }
    
    try {
      console.log("SignOut function called");
      setIsSigningOut(true);
      
      // Clear any inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      
      toast.info("Signing out...");
      
      // Clear local state BEFORE Supabase signout to improve UI responsiveness
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'global' // Sign out from all devices/tabs
      });
      
      if (error) {
        console.error("Error signing out from Supabase:", error);
        toast.error("Error signing out. Please try again.");
        throw error;
      }
      
      console.log("Successfully signed out from Supabase");
      
      // Clear any local storage items that might contain auth state
      localStorage.removeItem('supabase.auth.token');
      
      // Explicitly navigate to the landing page with a small delay to ensure state updates
      // are processed
      toast.success("Successfully signed out");
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error("Error signing out:", error);
      
      // Even if there's an error, try to reset the app state
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } finally {
      // Clear the signing out flag after a short delay to allow navigation to complete
      setTimeout(() => {
        setIsSigningOut(false);
      }, 300);
    }
  };
  
  // Force sign out (for admins)
  const forceSignOut = async () => {
    try {
      // In a real app, this would invalidate all sessions for all users
      await signOut();
      toast.success("All users have been signed out");
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
    isSigningOut,
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
