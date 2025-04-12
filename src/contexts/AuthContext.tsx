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
  forceSignOut: () => Promise<void>;
  authError: string | null;
  retryRoleFetch: () => Promise<void>;
};

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // Increasing to 30 minutes to prevent premature logout

const AuthContext = createContext<AuthContextType>({
  user: null,
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
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const inactivityTimerRef = useRef<number | null>(null);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
    }
    
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

  const fetchUserRole = async (userId: string) => {
    try {
      console.log("[AuthContext] Fetching role for user:", userId);
      setAuthError(null);
      
      const { data, error } = await supabase
        .rpc('get_user_role', {
          lookup_user_id: userId
        });

      console.log("[AuthContext] Role fetch response:", { data, error });

      if (error) {
        console.error("[AuthContext] Error fetching user role:", error);
        setAuthError(`Error fetching user role: ${error.message}`);
        toast({
          title: "Error fetching role",
          description: `We couldn't determine your user role: ${error.message}`,
          variant: "destructive",
        });
        return null;
      }

      if (!data || data.length === 0) {
        console.warn("[AuthContext] No role data returned for user:", userId);
        setAuthError("No role assigned to your account");
        toast({
          title: "Role not found",
          description: "Your account doesn't have an assigned role. Please contact an administrator.",
          variant: "destructive",
        });
        return null;
      }

      const roleValue = data[0]?.role;
      console.log("[AuthContext] Resolved role:", roleValue);
      
      if (roleValue) {
        toast({
          title: "Role detected",
          description: `You are logged in as: ${roleValue}`,
        });
      }
      
      return roleValue as UserRole;
    } catch (error: any) {
      console.error("[AuthContext] Exception in fetchUserRole:", error);
      const errorMessage = error?.message || "Unknown error fetching role";
      setAuthError(`Error fetching user role: ${errorMessage}`);
      toast({
        title: "Error",
        description: `Failed to get your user role: ${errorMessage}`,
        variant: "destructive",
      });
      return null;
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
        setUserRole(role);
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

  const handleAuthStateChange = async (session: any) => {
    console.log("[AuthContext] Auth state changed:", session ? "session exists" : "no session");
    
    try {
      if (session?.user) {
        console.log("[AuthContext] User in session:", session.user.id);
        setUser(session.user);
        
        try {
          console.log("[AuthContext] Attempting to fetch role");
          const role = await fetchUserRole(session.user.id);
          
          console.log("[AuthContext] Role after fetch:", role);
          
          if (role) {
            console.log("[AuthContext] Setting role to:", role);
            setUserRole(role);
          } else {
            console.warn("[AuthContext] No role found, setting to null");
            setUserRole(null);
          }
        } catch (roleError) {
          console.error("[AuthContext] Error in role fetching process:", roleError);
          setUserRole(null);
          setAuthError(`Error fetching role: ${roleError instanceof Error ? roleError.message : 'Unknown error'}`);
        }
        
        resetInactivityTimer();
      } else {
        console.log("[AuthContext] No user in session, clearing user and role");
        setUser(null);
        setUserRole(null);
        setAuthError(null);
        
        if (inactivityTimerRef.current) {
          window.clearTimeout(inactivityTimerRef.current);
          inactivityTimerRef.current = null;
        }
      }
    } catch (error) {
      console.error("[AuthContext] Error in handleAuthStateChange:", error);
      setAuthError(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log("[AuthContext] Auth state change processing complete");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("[AuthContext] Initializing auth context");
    
    const checkSession = async () => {
      console.log("[AuthContext] Checking session");
      
      try {
        const timeoutPromise = new Promise<{data: {session: null}}>((resolve) => {
          setTimeout(() => {
            console.log("[AuthContext] Session check timed out");
            resolve({data: {session: null}});
          }, 5000);
        });
        
        console.log("[AuthContext] Awaiting session from Supabase");
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);
        
        console.log("[AuthContext] Session check result:", session ? "session exists" : "no session");
        await handleAuthStateChange(session);
      } catch (error) {
        console.error("[AuthContext] Error checking session:", error);
        setAuthError(`Session check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsLoading(false);
      } finally {
        console.log("[AuthContext] Auth initialization complete");
        setAuthInitialized(true);
        setIsLoading(false);
      }
    };
    
    checkSession();

    try {
      console.log("[AuthContext] Setting up auth state change subscription");
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log("[AuthContext] Auth state change event:", _event);
        handleAuthStateChange(session);
      });

      return () => {
        console.log("[AuthContext] Cleaning up auth subscription");
        
        if (inactivityTimerRef.current) {
          window.clearTimeout(inactivityTimerRef.current);
        }
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("[AuthContext] Error setting up auth subscription:", error);
      setAuthError(`Auth subscription error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
      setAuthInitialized(true);
      return () => {
        if (inactivityTimerRef.current) {
          window.clearTimeout(inactivityTimerRef.current);
        }
      };
    }
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
      setUserRole(null);
      setAuthError(null);
      
      const { error } = await supabase.auth.signOut();
      
      navigate('/', { replace: true });
      
      if (error) {
        console.error("[AuthContext] Error during sign out:", error);
        toast({
          variant: "destructive",
          title: "Warning",
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

  if (!authInitialized) {
    return (
      <AuthContext.Provider value={{ 
        user: null, 
        userRole: null, 
        isLoading: true, 
        signOut: async () => {}, 
        resetInactivityTimer: () => {}, 
        forceSignOut: async () => {},
        authError: null,
        retryRoleFetch: async () => {},
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
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
