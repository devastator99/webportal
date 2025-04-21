
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

type UserRole = "doctor" | "patient" | "administrator" | "nutritionist" | "reception";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  resetInactivityTimer: () => void;
  forceSignOut: () => Promise<void>;
  authError: string | null;
  retryRoleFetch: () => Promise<void>;
};

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userRole: null,
  isLoading: true,
  signOut: async () => {},
  resetInactivityTimer: () => {},
  forceSignOut: async () => {},
  authError: null,
  retryRoleFetch: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const inactivityTimerRef = useRef<number | null>(null);
  const roleFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const recoveryAttempted = useRef(false);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
    }
    
    if (user) {
      inactivityTimerRef.current = window.setTimeout(() => {
        signOut();
        toast("Session expired", {
          description: "You have been logged out due to inactivity",
        });
      }, INACTIVITY_TIMEOUT);
    }
  };

  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      console.log("[AuthContext] Fetching role for user:", userId);
      setAuthError(null);
      
      const { data, error } = await supabase
        .rpc('get_user_role', {
          lookup_user_id: userId
        });

      if (error) {
        console.error("[AuthContext] Error fetching user role:", error);
        setAuthError(`Error fetching user role: ${error.message}`);
        return null;
      }

      if (!data || data.length === 0) {
        console.warn("[AuthContext] No role data returned for user:", userId);
        setAuthError("No role assigned to your account");
        return null;
      }

      const roleValue = data[0]?.role as UserRole;
      console.log("[AuthContext] Resolved role:", roleValue);
      
      return roleValue;
    } catch (error: any) {
      console.error("[AuthContext] Exception in fetchUserRole:", error);
      setAuthError(`Error fetching user role: ${error.message}`);
      return null;
    }
  };

  const handleAuthStateChange = async (currentSession: Session | null) => {
    console.log("[AuthContext] Auth state changed:", currentSession ? "session exists" : "no session");
    
    try {
      if (currentSession?.user) {
        setUser(currentSession.user);
        setSession(currentSession);
        
        // Clear any existing role fetch timeout
        if (roleFetchTimeoutRef.current) {
          clearTimeout(roleFetchTimeoutRef.current);
        }
        
        // Debounce role fetching
        roleFetchTimeoutRef.current = setTimeout(async () => {
          const role = await fetchUserRole(currentSession.user.id);
          if (role) {
            setUserRole(role);
            setAuthError(null);
          }
          setIsLoading(false);
        }, 100);
        
        resetInactivityTimer();
      } else {
        setUser(null);
        setSession(null);
        setUserRole(null);
        setAuthError(null);
        setIsLoading(false);
        
        if (inactivityTimerRef.current) {
          window.clearTimeout(inactivityTimerRef.current);
        }
      }
    } catch (error) {
      console.error("[AuthContext] Error in handleAuthStateChange:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("[AuthContext] Setting up auth subscription");
    
    // Set up the auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthStateChange(session);
    });

    // Then check for existing session (order is important)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setIsLoading(true);
      
      // Get the current session state
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log("[AuthContext] Initial session check:", session ? "session exists" : "no session");
        
        if (!session && !recoveryAttempted.current) {
          recoveryAttempted.current = true;
          console.log("[AuthContext] Attempting one-time session recovery");
          
          // Force a refresh of the auth state to recover from any potential issues
          supabase.auth.refreshSession().then(({ data, error }) => {
            if (error) {
              console.error("[AuthContext] Session recovery failed:", error);
              setIsLoading(false);
            } else if (data.session) {
              console.log("[AuthContext] Session successfully recovered");
              handleAuthStateChange(data.session);
            } else {
              console.log("[AuthContext] No session to recover");
              setIsLoading(false);
            }
          });
        } else {
          handleAuthStateChange(session);
        }
      });
    }

    return () => {
      console.log("[AuthContext] Cleaning up auth subscription");
      subscription.unsubscribe();
      
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      
      if (roleFetchTimeoutRef.current) {
        clearTimeout(roleFetchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];
    
    const handleUserActivity = () => {
      resetInactivityTimer();
    };
    
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    resetInactivityTimer();
    
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
      console.log("[AuthContext] Sign out initiated");
      setIsLoading(true);
      
      setUser(null);
      setSession(null);
      setUserRole(null);
      setAuthError(null);
      
      const { error } = await supabase.auth.signOut();
      
      navigate('/', { replace: true });
      
      if (error) {
        console.error("[AuthContext] Error during sign out:", error);
        toast("Warning", {
          description: "Sign out completed, but there was an API error."
        });
      }
      
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    } catch (error: any) {
      console.error("[AuthContext] Exception during sign out:", error);
      navigate('/', { replace: true });
    } finally {
      console.log("[AuthContext] Sign out complete");
      setIsLoading(false);
    }
  };

  const forceSignOut = async () => {
    try {
      console.log("[AuthContext] Force sign out initiated");
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      await supabase.auth.signOut();
      
      window.location.href = '/';
      
      return Promise.resolve();
    } catch (error) {
      console.error("[AuthContext] Force sign out error:", error);
      
      window.location.href = '/';
      
      return Promise.resolve();
    }
  };

  const retryRoleFetch = async () => {
    if (!user) return;
    
    console.log("[AuthContext] Retrying role fetch for user:", user.id);
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const role = await fetchUserRole(user.id);
      if (role) {
        console.log("[AuthContext] Role fetch retry successful:", role);
        setUserRole(role as UserRole);
        setAuthError(null);
      } else {
        console.log("[AuthContext] Role fetch retry failed: No role found");
      }
    } catch (error) {
      console.error("[AuthContext] Error in retryRoleFetch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      userRole, 
      isLoading, 
      signOut, 
      resetInactivityTimer, 
      forceSignOut,
      authError,
      retryRoleFetch
    }}>
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
