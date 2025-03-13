
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
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_role', {
          lookup_user_id: userId
        });

      if (error) {
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const roleValue = data[0]?.role;
      return roleValue as UserRole;
    } catch (error) {
      return null;
    }
  };

  const handleAuthStateChange = async (session: any) => {
    try {
      if (session?.user) {
        setUser(session.user);
        
        try {
          const role = await fetchUserRole(session.user.id);
          
          if (role) {
            setUserRole(role);
          } else {
            setUserRole(null);
          }
        } catch (roleError) {
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const timeoutPromise = new Promise<{data: {session: null}}>((resolve) => {
          setTimeout(() => {
            resolve({data: {session: null}});
          }, 3000);
        });
        
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);
        
        await handleAuthStateChange(session);
      } catch (error) {
        setIsLoading(false);
      } finally {
        setAuthInitialized(true);
        setIsLoading(false);
      }
    };
    
    checkSession();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        handleAuthStateChange(session);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      setIsLoading(false);
      setAuthInitialized(true);
      return () => {};
    }
  }, []);

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      setUser(null);
      setUserRole(null);
      
      const { error } = await supabase.auth.signOut();
      
      navigate('/', { replace: true });
      
      if (error) {
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
      navigate('/', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  if (!authInitialized) {
    return (
      <AuthContext.Provider value={{ user: null, userRole: null, isLoading: true, signOut: async () => {} }}>
        {children}
      </AuthContext.Provider>
    );
  }

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
