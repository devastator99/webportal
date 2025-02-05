
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
  signOut: async () => {} 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
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

  const signOut = async () => {
    setIsLoading(true); // Set loading at start of signout
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setUserRole(null);
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      setIsLoading(false); // Always set loading to false after signout
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (!mounted) return; // Check if component is mounted before proceeding
        setIsLoading(true);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          if (mounted) {
            setUser(null);
            setUserRole(null);
          }
          return;
        }

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
        console.error("Error checking auth session:", error);
        if (mounted) {
          setUser(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false); // Always set loading to false when done
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      
      if (!mounted) return; // Check if component is mounted before proceeding
      
      setIsLoading(true); // Set loading at start of auth state change
      
      try {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setUserRole(null);
          console.log("User signed out or session ended");
        } else if (event === 'SIGNED_IN' && session?.user) {
          const newRole = await fetchUserRole(session.user.id);
          setUser(session.user);
          setUserRole(newRole);
          console.log("User signed in:", session.user.email, "role:", newRole);
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error handling auth state change:", error);
        setUser(null);
        setUserRole(null);
      } finally {
        if (mounted) {
          setIsLoading(false); // Always set loading to false after auth state change
        }
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, userRole, isLoading, signOut }}>
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
