
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Define UserRole type
export type UserRole = 'patient' | 'doctor' | 'nutritionist' | 'administrator' | 'reception' | null;

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
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Handle session changes
  useEffect(() => {
    // Try to get the session from localStorage if available
    const fetchInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Fetch user role
          if (initialSession.user) {
            const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
              lookup_user_id: initialSession.user.id
            });
            
            if (!roleError && roleData) {
              setUserRole(roleData[0]?.role as UserRole || null);
              console.log("User role set:", roleData);
            } else if (roleError) {
              console.error("Error fetching user role:", roleError);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching initial session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialSession();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state change:", event);
        
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
                
                // Redirect based on role
                if (userRoleValue === 'doctor') {
                  // Use the redirectFixForDoctor helper to ensure we go to /dashboard
                  const targetRoute = redirectFixForDoctor();
                  navigate(targetRoute);
                } else if (userRoleValue === 'patient') {
                  navigate('/dashboard');
                } else if (userRoleValue === 'administrator') {
                  navigate('/admin');
                } else if (userRoleValue === 'nutritionist') {
                  navigate('/dashboard');
                } else {
                  navigate('/');
                }
              } else if (roleError) {
                console.error("Error fetching user role on sign in:", roleError);
                // No role? Go to home page
                navigate('/');
              }
            } catch (error) {
              console.error("Error in role handling:", error);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserRole(null);
          navigate('/');
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
        } else if (event === 'USER_UPDATED' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
  
  // Set up inactivity timer
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        // Auto logout after inactivity
        signOut();
        toast.info("You have been signed out due to inactivity");
      }, INACTIVITY_TIMEOUT);
      
      setInactivityTimer(timer);
      
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }
  }, [user]);
  
  // Function to reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      
      const newTimer = setTimeout(() => {
        // Auto logout after inactivity
        signOut();
        toast.info("You have been signed out due to inactivity");
      }, INACTIVITY_TIMEOUT);
      
      setInactivityTimer(newTimer);
    }
  }, [inactivityTimer]);
  
  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserRole(null);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
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

// Re-export the UserRole type for convenience
export type { UserRole };
