import { createContext, useContext, useEffect, useState } from "react";
import { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type UserRole = "doctor" | "patient" | "administrator" | "nutritionist";

type AuthContextType = {
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isInitialized: boolean;
  signOut: () => Promise<void>;
  error: string | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isLoading: true,
  isInitialized: false,
  signOut: async () => {},
  error: null
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data?.role as UserRole;
    } catch (error) {
      console.error('Error fetching user role:', error);
      setError('Failed to fetch user role');
      return null;
    }
  };

  const signOut = async () => {
    try {
      console.log("Starting sign out process...");
      setIsLoading(true);
      setError(null);
      
      // Clear all local storage data
      localStorage.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear state
      setUser(null);
      setUserRole(null);
      
      console.log("Sign out successful, redirecting...");
      
      // Force a complete page reload to clear all state
      window.location.href = '/';
      
    } catch (error: any) {
      console.error("Sign out error:", error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message || "An error occurred while signing out.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // Store the timestamp when the page becomes hidden
        localStorage.setItem('lastActive', new Date().toISOString());
      } else if (document.visibilityState === 'visible') {
        const lastActive = localStorage.getItem('lastActive');
        if (lastActive) {
          const inactiveTime = new Date().getTime() - new Date(lastActive).getTime();
          // If inactive for more than 30 minutes, sign out
          if (inactiveTime > 30 * 60 * 1000) {
            await signOut();
            toast({
              title: "Session expired",
              description: "You've been signed out due to inactivity.",
            });
          }
        }
      }
    };

    // Handle page close/refresh
    const handleBeforeUnload = () => {
      localStorage.setItem('lastActive', new Date().toISOString());
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [toast]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check last active timestamp on initialization
        const lastActive = localStorage.getItem('lastActive');
        if (lastActive) {
          const inactiveTime = new Date().getTime() - new Date(lastActive).getTime();
          if (inactiveTime > 30 * 60 * 1000) {
            await signOut();
            return;
          }
        }

        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user && mounted) {
          const role = await fetchUserRole(session.user.id);
          setUser(session.user);
          setUserRole(role);
          console.log("Session initialized with user:", session.user.email, "role:", role);
        } else if (mounted) {
          setUser(null);
          setUserRole(null);
          console.log("No active session found");
        }
      } catch (error: any) {
        console.error("Error initializing auth:", error);
        setError(error.message);
        if (mounted) {
          setUser(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state changed:", event, session?.user?.email);
      
      try {
        setIsLoading(true);
        setError(null);
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setUserRole(null);
          navigate('/auth');
          console.log("User signed out or session ended");
        } else if (event === 'SIGNED_IN' && session?.user) {
          const newRole = await fetchUserRole(session.user.id);
          setUser(session.user);
          setUserRole(newRole);
          console.log("User signed in:", session.user.email, "role:", newRole);
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error("Error handling auth state change:", error);
        setError(error.message);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message || "An error occurred while processing authentication.",
        });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        userRole, 
        isLoading, 
        isInitialized,
        signOut,
        error 
      }}
    >
      {isInitialized ? children : null}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};