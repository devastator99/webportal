
import { createContext, useContext, useEffect, useState } from "react";
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
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isLoading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('[Auth Debug] Fetching role for user ID:', userId);
      
      const { data, error } = await supabase
        .rpc('get_user_role', {
          lookup_user_id: userId
        });

      if (error) {
        console.error('[Auth Debug] Error fetching user role:', error);
        toast({
          variant: "destructive",
          title: "Error fetching user role",
          description: "Please try refreshing the page"
        });
        return null;
      }

      console.log('[Auth Debug] Role data received:', data);
      return data?.[0]?.role as UserRole;
    } catch (error) {
      console.error('[Auth Debug] Exception in fetchUserRole:', error);
      return null;
    }
  };

  const handleAuthStateChange = async (session: any) => {
    try {
      setIsLoading(true);
      
      if (session?.user) {
        console.log('[Auth Debug] Auth state change - user found:', session.user.id, 'email:', session.user.email);
        setUser(session.user);
        const role = await fetchUserRole(session.user.id);
        console.log('[Auth Debug] Role fetched:', role);
        setUserRole(role);
      } else {
        console.log('[Auth Debug] Auth state change - no user');
        setUser(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error('[Auth Debug] Error in handleAuthStateChange:', error);
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "There was an error managing your session"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[Auth Debug] Initial session check:', session ? 'Session found' : 'No session');
      if (session) {
        console.log('[Auth Debug] Session user:', session.user.email);
      }
      await handleAuthStateChange(session);
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[Auth Debug] Auth state change event:', _event);
      handleAuthStateChange(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log('[Auth Debug] Auth context updated:', {
      user: user?.id,
      email: user?.email,
      userRole,
      isLoading
    });
  }, [user, userRole, isLoading]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log('Signing out...');
      
      setUser(null);
      setUserRole(null);
      
      const { error } = await supabase.auth.signOut();
      
      navigate('/', { replace: true });
      
      if (error) {
        console.error('Error in supabase.auth.signOut:', error);
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
    } catch (error: any) {
      console.error('Exception in signOut function:', error);
      toast({
        variant: "destructive",
        title: "Error during sign out",
        description: error.message || "An unexpected error occurred"
      });
      
      navigate('/', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, isLoading, signOut }}>
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
