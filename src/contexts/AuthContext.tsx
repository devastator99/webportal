
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
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
      console.log("Fetching user role for ID:", userId, "at:", new Date().toISOString());
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      console.log("Role fetch result:", { data, error, timestamp: new Date().toISOString() });

      if (error) throw error;
      return data?.role as UserRole;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  const clearAuthState = () => {
    console.log("Clearing auth state at:", new Date().toISOString());
    setUser(null);
    setUserRole(null);
    setError(null);
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset Supabase session
    supabase.auth.setSession(null);
    
    console.log("Auth state cleared at:", new Date().toISOString());
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log("Starting sign out process at:", new Date().toISOString());
      
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Sign out timed out")), 5000))
      ]);
      
      clearAuthState();
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
      
      // Force navigate to home
      navigate('/', { replace: true });
      
      // Force page reload to clear any remaining state
      window.location.reload();
    } catch (error) {
      console.error("Sign out error:", error);
      
      clearAuthState();
      
      toast({
        variant: "destructive",
        title: "Error during sign out",
        description: "You have been forcefully signed out due to an error.",
      });
      
      // Force navigate to home
      navigate('/', { replace: true });
      
      // Force page reload
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("Initializing auth at:", new Date().toISOString());
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log("Got session:", {
          hasSession: !!session,
          userEmail: session?.user?.email,
          timestamp: new Date().toISOString()
        });
        
        if (session?.user && mounted) {
          const role = await fetchUserRole(session.user.id);
          console.log("Initialization complete:", {
            userEmail: session.user.email,
            role,
            timestamp: new Date().toISOString()
          });
          setUser(session.user);
          setUserRole(role);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        clearAuthState();
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state changed:", {
        event,
        userEmail: session?.user?.email,
        timestamp: new Date().toISOString()
      });
      
      try {
        setIsLoading(true);
        
        if (event === 'SIGNED_OUT' || !session) {
          console.log("User signed out or no session at:", new Date().toISOString());
          clearAuthState();
          navigate('/', { replace: true });
        } else if (session?.user) {
          const role = await fetchUserRole(session.user.id);
          console.log("User authenticated:", {
            event,
            userEmail: session.user.email,
            role,
            timestamp: new Date().toISOString()
          });
          setUser(session.user);
          setUserRole(role);
          if (event === 'SIGNED_IN') {
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (error: any) {
        console.error("Error handling auth state change:", error);
        clearAuthState();
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message || "An error occurred.",
        });
        navigate('/', { replace: true });
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
      {children}
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
