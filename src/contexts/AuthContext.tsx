
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
      console.log('Fetching role for user:', userId);
      
      // Use RPC call instead of direct table access
      const { data, error } = await supabase
        .rpc('get_user_role', {
          lookup_user_id: userId
        });

      if (error) {
        console.error('Error fetching user role:', error);
        toast({
          variant: "destructive",
          title: "Error fetching user role",
          description: "Please try refreshing the page"
        });
        return null;
      }

      console.log('Role data received:', data);
      // The RPC returns an array with a single object containing the role
      return data?.[0]?.role as UserRole;
    } catch (error) {
      console.error('Exception in fetchUserRole:', error);
      return null;
    }
  };

  const handleAuthStateChange = async (session: any) => {
    try {
      setIsLoading(true);
      
      if (session?.user) {
        console.log('Auth state change - user found:', session.user.id);
        setUser(session.user);
        const role = await fetchUserRole(session.user.id);
        console.log('Role fetched:', role);
        setUserRole(role);
      } else {
        console.log('Auth state change - no user');
        setUser(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error in handleAuthStateChange:', error);
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
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthStateChange(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setUserRole(null);
      navigate('/', { replace: true });
      
      toast({
        title: "Signed out successfully"
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message
      });
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
