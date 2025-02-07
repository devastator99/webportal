
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
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data?.role as UserRole;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  const clearAuthState = () => {
    setUser(null);
    setUserRole(null);
    setError(null);
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      clearAuthState();
      await supabase.auth.signOut();
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
      
      navigate('/', { replace: true });
    } catch (error) {
      console.error("Sign out error:", error);
      
      toast({
        variant: "destructive",
        title: "Error during sign out",
        description: "You have been forcefully signed out due to an error.",
      });
      
      navigate('/', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("AuthContext: Starting initialization");
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("AuthContext: Getting session");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          console.log("AuthContext: Session found, fetching role");
          const role = await fetchUserRole(session.user.id);
          setUser(session.user);
          setUserRole(role);
          console.log("AuthContext: Initialization complete with user");
        } else {
          console.log("AuthContext: No session found");
          clearAuthState();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        clearAuthState();
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
          console.log("AuthContext: Initialization complete");
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("AuthContext: Auth state change:", event);
      
      try {
        setIsLoading(true);
        
        if (event === 'SIGNED_OUT' || !session) {
          clearAuthState();
          navigate('/', { replace: true });
        } else if (session?.user) {
          const role = await fetchUserRole(session.user.id);
          setUser(session.user);
          setUserRole(role);
          if (event === 'SIGNED_IN') {
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (error) {
        console.error("Error handling auth state change:", error);
        clearAuthState();
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "An error occurred during authentication.",
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
