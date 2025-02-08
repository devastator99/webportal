
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

  const fetchUserRole = async (userId: string) => {
    try {
      console.log("[AuthContext] Fetching user role for:", userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthContext] Error fetching user role:', error);
        return null;
      }

      if (!data) {
        console.warn('[AuthContext] No role found for user:', userId);
        return null;
      }

      console.log('[AuthContext] User role fetched:', data.role);
      return data.role as UserRole;
    } catch (error) {
      console.error('[AuthContext] Error in fetchUserRole:', error);
      return null;
    }
  };

  const handleRoleBasedRedirect = (role: UserRole | null) => {
    if (!role) return;
    
    switch (role) {
      case "administrator":
        navigate("/admin");
        break;
      case "doctor":
      case "patient":
      case "nutritionist":
        navigate("/dashboard");
        break;
      default:
        navigate("/");
        break;
    }
  };

  const clearAuthState = () => {
    setUser(null);
    setUserRole(null);
    setError(null);
  };

  const handleAuthStateChange = async (session: any) => {
    console.log("[AuthContext] Auth state changed:", { 
      hasSession: !!session,
      userId: session?.user?.id 
    });
    
    if (!session?.user) {
      clearAuthState();
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }

    try {
      setUser(session.user);
      const role = await fetchUserRole(session.user.id);
      setUserRole(role);
      
      console.log("[AuthContext] Auth state updated:", { 
        userId: session.user.id,
        role 
      });

      // Redirect based on role
      handleRoleBasedRedirect(role);
    } catch (error: any) {
      console.error("[AuthContext] Error handling auth state:", error);
      clearAuthState();
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "An error occurred during authentication.",
      });
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log("[AuthContext] Starting sign out process");
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      clearAuthState();
      navigate('/', { replace: true });
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error: any) {
      console.error("[AuthContext] Sign out error:", error);
      toast({
        variant: "destructive",
        title: "Error during sign out",
        description: error.message || "An error occurred during sign out.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log("[AuthContext] Initializing auth context");

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[AuthContext] Initial session:", { 
          hasSession: !!session,
          userId: session?.user?.id 
        });
        
        if (mounted) {
          await handleAuthStateChange(session);
        }
      } catch (error) {
        console.error("[AuthContext] Initialization error:", error);
        if (mounted) {
          clearAuthState();
          setIsInitialized(true);
          setIsLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthContext] Auth state change event:", event);
      
      if (!mounted) return;

      await handleAuthStateChange(session);
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
