
import { createContext, useContext, useEffect, useState } from "react";
import { User, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export const NoRoleWarning = ({ onSignOut }: { onSignOut: () => Promise<void> }) => (
  <div className="container mx-auto p-6">
    <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
      <h1 className="text-2xl font-bold text-destructive mb-4">No Role Assigned</h1>
      <p className="text-gray-600 mb-6">
        Your account doesn't have a role assigned. Please contact support or sign out and try again.
      </p>
      <Button 
        onClick={onSignOut}
        variant="outline" 
        className="border-destructive text-destructive hover:bg-destructive/10 gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  </div>
);

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
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { checking_user_id: userId })
        .maybeSingle();

      if (roleError) {
        console.error('[AuthContext] Error fetching user role:', roleError);
        throw roleError;
      }

      if (!roleData) {
        console.warn('[AuthContext] No role found for user:', userId);
        setUserRole(null);
        return null;
      }

      console.log('[AuthContext] User role fetched:', roleData.role);
      setUserRole(roleData.role as UserRole);
      return roleData.role as UserRole;
    } catch (error) {
      console.error('[AuthContext] Error in fetchUserRole:', error);
      setUserRole(null);
      throw error;
    }
  };

  const handleRoleBasedRedirect = (role: UserRole | null, currentPath: string) => {
    if (!role) {
      console.log("[AuthContext] No role found, staying on current path");
      return;
    }
    
    const isOnRootPath = currentPath === "/" || currentPath === "/index";
    if (!isOnRootPath) {
      console.log("[AuthContext] User is not on root path, keeping current location");
      return;
    }

    console.log("[AuthContext] Redirecting based on role:", role);
    switch (role) {
      case "administrator":
        navigate("/admin", { replace: true });
        break;
      case "doctor":
      case "patient":
      case "nutritionist":
        navigate("/dashboard", { replace: true });
        break;
      default:
        break;
    }
  };

  const clearAuthState = () => {
    console.log("[AuthContext] Clearing auth state");
    setUser(null);
    setUserRole(null);
    setError(null);
    setIsLoading(false);
    setIsInitialized(true);
    
    console.log("[AuthContext] Redirecting to root after clearing auth state");
    navigate('/', { replace: true });
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log("[AuthContext] Starting sign out process");
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log("[AuthContext] Sign out successful");
      clearAuthState();
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error: any) {
      console.error("[AuthContext] Sign out error:", error);
      clearAuthState();
      
      toast({
        variant: "destructive",
        title: "Error during sign out",
        description: error.message || "An error occurred during sign out.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthStateChange = async (session: any) => {
    console.log("[AuthContext] Auth state changed:", { 
      hasSession: !!session,
      userId: session?.user?.id 
    });
    
    try {
      if (!session?.user) {
        console.log("[AuthContext] No session, clearing auth state");
        clearAuthState();
        return;
      }

      setUser(session.user);
      const role = await fetchUserRole(session.user.id);
      
      console.log("[AuthContext] Auth state updated:", { 
        userId: session.user.id,
        role 
      });

      const currentPath = window.location.pathname;
      handleRoleBasedRedirect(role, currentPath);
      
      setIsLoading(false);
      setIsInitialized(true);
    } catch (error: any) {
      console.error("[AuthContext] Error handling auth state:", error);
      clearAuthState();
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "An error occurred during authentication.",
      });
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
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
      console.log("[AuthContext] Auth state change event:", event);
      
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        console.log("[AuthContext] User signed out");
        clearAuthState();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await handleAuthStateChange(session);
      } else {
        // Handle any other valid auth events by re-checking the session
        await handleAuthStateChange(session);
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
