
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type UserRole = "doctor" | "patient" | "administrator" | "nutritionist" | "reception";

type AuthContextType = {
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  resetInactivityTimer: () => void;
};

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isLoading: true,
  signOut: async () => {},
  resetInactivityTimer: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const inactivityTimerRef = useRef<number | null>(null);

  const resetInactivityTimer = () => {
    // Clear the existing timer if there is one
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
    }
    
    // Only set a new timer if the user is logged in
    if (user) {
      inactivityTimerRef.current = window.setTimeout(() => {
        signOut();
        toast({
          title: "Session expired",
          description: "You have been logged out due to inactivity",
        });
      }, INACTIVITY_TIMEOUT);
    }
  };

  // Fetch user role function
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_role', {
          lookup_user_id: userId
        });

      if (error) {
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const roleValue = data[0]?.role;
      return roleValue as UserRole;
    } catch (error) {
      return null;
    }
  };

  const handleAuthStateChange = async (session: any) => {
    try {
      if (session?.user) {
        setUser(session.user);
        
        try {
          const role = await fetchUserRole(session.user.id);
          
          if (role) {
            setUserRole(role);
          } else {
            setUserRole(null);
          }
        } catch (roleError) {
          setUserRole(null);
        }
        
        // Reset the inactivity timer when auth state changes to logged in
        resetInactivityTimer();
      } else {
        setUser(null);
        setUserRole(null);
        
        // Clear any existing inactivity timer when logged out
        if (inactivityTimerRef.current) {
          window.clearTimeout(inactivityTimerRef.current);
          inactivityTimerRef.current = null;
        }
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const timeoutPromise = new Promise<{data: {session: null}}>((resolve) => {
          setTimeout(() => {
            resolve({data: {session: null}});
          }, 3000);
        });
        
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);
        
        await handleAuthStateChange(session);
      } catch (error) {
        setIsLoading(false);
      } finally {
        setAuthInitialized(true);
        setIsLoading(false);
      }
    };
    
    checkSession();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        handleAuthStateChange(session);
      });

      return () => {
        // Clean up the inactivity timer when the component unmounts
        if (inactivityTimerRef.current) {
          window.clearTimeout(inactivityTimerRef.current);
        }
        subscription.unsubscribe();
      };
    } catch (error) {
      setIsLoading(false);
      setAuthInitialized(true);
      return () => {
        // Clean up the inactivity timer when the component unmounts
        if (inactivityTimerRef.current) {
          window.clearTimeout(inactivityTimerRef.current);
        }
      };
    }
  }, []);

  // Set up event listeners for user activity to reset the timer
  useEffect(() => {
    // Only set up listeners if we have a user
    if (!user) return;
    
    // List of events to listen for
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];
    
    // Event handler to reset the timer
    const handleUserActivity = () => {
      resetInactivityTimer();
    };
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // Initialize the timer
    resetInactivityTimer();
    
    // Clean up event listeners on unmount
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      setUser(null);
      setUserRole(null);
      
      const { error } = await supabase.auth.signOut();
      
      navigate('/', { replace: true });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Sign out completed, but there was an API error."
        });
      } else {
        toast({
          title: "Signed out successfully"
        });
      }
      
      // Clear the inactivity timer when signing out
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    } catch (error: any) {
      navigate('/', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  if (!authInitialized) {
    return (
      <AuthContext.Provider value={{ user: null, userRole: null, isLoading: true, signOut: async () => {}, resetInactivityTimer: () => {} }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userRole, isLoading, signOut, resetInactivityTimer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
