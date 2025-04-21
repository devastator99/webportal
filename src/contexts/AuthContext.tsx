
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

// Export the UserRole type so it can be imported elsewhere
export type UserRole = "doctor" | "patient" | "administrator" | "nutritionist" | "reception";

// Create enum-like constants for better type safety
export const UserRole = {
  doctor: "doctor" as UserRole,
  patient: "patient" as UserRole,
  administrator: "administrator" as UserRole,
  nutritionist: "nutritionist" as UserRole,
  reception: "reception" as UserRole
};

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
  const location = useLocation();
  const { toast: uiToast } = useToast();
  const inactivityTimerRef = useRef<number | null>(null);
  const roleFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const recoveryAttempted = useRef(false);
  const isPasswordRecoveryFlow = useRef(false);
  const hasRedirectedUser = useRef(false);

  useEffect(() => {
    const checkForRecoveryMode = () => {
      const pathname = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;
      
      console.log("[AuthContext] URL check:", { pathname, search, hash });
      
      const isRecovery = 
        (pathname === '/update-password' && search.includes('type=recovery')) ||
        (pathname === '/update-password' && hash.includes('type=recovery')) ||
        (hash.includes('access_token') && hash.includes('type=recovery')) ||
        (hash.includes('type=recovery'));
      
      if (isRecovery) {
        console.log("[AuthContext] Password reset flow detected");
        isPasswordRecoveryFlow.current = true;
        
        if (pathname !== '/update-password' && hash.includes('type=recovery')) {
          console.log("[AuthContext] Redirecting to update-password page");
          navigate('/update-password' + search + hash, { replace: true });
        }
        
        setIsLoading(false);
        return true;
      }
      return false;
    };
    
    checkForRecoveryMode();
  }, [location.pathname, location.search, location.hash, navigate]);

  useEffect(() => {
    const hash = window.location.hash || "";
    const pathname = window.location.pathname;
    const search = window.location.search;

    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
    const type = hashParams.get("type");
    const accessToken = hashParams.get("access_token");

    const isSupabaseResetLink =
      type === "recovery" && typeof accessToken === "string" && !!accessToken;

    if (
      isSupabaseResetLink &&
      pathname !== "/update-password"
    ) {
      const params = new URLSearchParams();
      params.set("type", "recovery");
      if (accessToken) params.set("access_token", accessToken);
      if (hashParams.get("refresh_token")) params.set("refresh_token", hashParams.get("refresh_token"));
      const redirectUrl = `/update-password?${params.toString()}`;

      console.log("[AuthProvider] Detected Supabase password-reset link via hash. Redirecting to:", redirectUrl);

      window.location.replace(redirectUrl);
    }
  }, []);

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

  const redirectUserBasedOnRole = (role: UserRole | null) => {
    if (hasRedirectedUser.current) return;
    
    if (role === 'patient') {
      console.log("[AuthContext] Patient detected, redirecting to chat");
      navigate('/chat', { replace: true });
      hasRedirectedUser.current = true;
    } else if (role) {
      const targetRoute = 
        role === 'doctor' ? '/doctor-dashboard' :
        role === 'nutritionist' ? '/nutritionist-dashboard' :
        role === 'administrator' ? '/admin' :
        '/dashboard';
      
      console.log(`[AuthContext] ${role} detected, redirecting to ${targetRoute}`);
      navigate(targetRoute, { replace: true });
      hasRedirectedUser.current = true;
    }
  };

  const handleAuthStateChange = async (currentSession: Session | null) => {
    console.log("[AuthContext] Auth state changed:", currentSession ? "session exists" : "no session");
    
    try {
      if (isPasswordRecoveryFlow.current) {
        console.log("[AuthContext] In password recovery mode, skipping normal auth flow");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      hasRedirectedUser.current = false;
      
      if (currentSession?.user) {
        setUser(currentSession.user);
        setSession(currentSession);
        
        if (roleFetchTimeoutRef.current) {
          clearTimeout(roleFetchTimeoutRef.current);
        }
        
        roleFetchTimeoutRef.current = setTimeout(async () => {
          const role = await fetchUserRole(currentSession.user.id);
          if (role) {
            setUserRole(role);
            setAuthError(null);
            redirectUserBasedOnRole(role);
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log("[AuthContext] Auth state change event:", _event);
      
      setTimeout(() => {
        handleAuthStateChange(newSession);
      }, 0);
    });

    const initializeAuth = async () => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        setIsLoading(true);
        
        try {
          const inPasswordFlow = isPasswordRecoveryFlow.current;
          
          if (inPasswordFlow) {
            console.log("[AuthContext] In password recovery flow, skipping session initialization");
            setIsLoading(false);
            return;
          }
          
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          console.log("[AuthContext] Initial session check:", currentSession ? "session exists" : "no session");
          
          if (!currentSession && !recoveryAttempted.current && !inPasswordFlow) {
            recoveryAttempted.current = true;
            console.log("[AuthContext] Attempting one-time session recovery");
            
            try {
              const { data, error } = await supabase.auth.refreshSession();
              
              if (error) {
                console.error("[AuthContext] Session recovery failed:", error);
                setIsLoading(false);
              } else if (data.session) {
                console.log("[AuthContext] Session successfully recovered");
                await handleAuthStateChange(data.session);
              } else {
                console.log("[AuthContext] No session to recover");
                setIsLoading(false);
              }
            } catch (error) {
              console.error("[AuthContext] Exception during session recovery:", error);
              setIsLoading(false);
            }
          } else {
            if (inPasswordFlow) {
              console.log("[AuthContext] In password recovery flow, skipping session recovery");
              setIsLoading(false);
            } else {
              await handleAuthStateChange(currentSession);
            }
          }
        } catch (error) {
          console.error("[AuthContext] Exception during initial auth setup:", error);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

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

  useEffect(() => {
    if (userRole && !isLoading && !isPasswordRecoveryFlow.current) {
      redirectUserBasedOnRole(userRole);
    }
  }, [userRole, isLoading]);

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
