
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
      console.log('[Auth Debug] Fetching role for user ID:', userId);
      
      const { data, error } = await supabase
        .rpc('get_user_role', {
          lookup_user_id: userId
        });

      if (error) {
        console.error('[Auth Debug] Error fetching user role:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('[Auth Debug] No role data received for user:', userId);
        return null;
      }

      console.log('[Auth Debug] Role data received:', data);
      const roleValue = data[0]?.role;
      console.log('[Auth Debug] Extracted role value:', roleValue);
      
      return roleValue as UserRole;
    } catch (error) {
      console.error('[Auth Debug] Exception in fetchUserRole:', error);
      return null;
    }
  };

  const handleAuthStateChange = async (session: any) => {
    try {
      if (session?.user) {
        console.log('[Auth Debug] Auth state change - user found');
        setUser(session.user);
        
        try {
          const role = await fetchUserRole(session.user.id);
          
          if (role) {
            setUserRole(role);
            console.log('[Auth Debug] User role set to:', role);
          } else {
            console.log('[Auth Debug] No role found for user, setting userRole to null');
            setUserRole(null);
          }
        } catch (roleError) {
          console.error('[Auth Debug] Error fetching role, continuing without role:', roleError);
          setUserRole(null);
        }
      } else {
        console.log('[Auth Debug] Auth state change - no user');
        setUser(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error('[Auth Debug] Error in handleAuthStateChange:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('[Auth Debug] Checking session...');
        
        const timeoutPromise = new Promise<{data: {session: null}}>((resolve) => {
          setTimeout(() => {
            console.log('[Auth Debug] Session check timed out, continuing without session');
            resolve({data: {session: null}});
          }, 3000);
        });
        
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);
        
        console.log('[Auth Debug] Initial session check:', session ? 'Session found' : 'No session');
        await handleAuthStateChange(session);
      } catch (error) {
        console.error('[Auth Debug] Error checking session:', error);
        setIsLoading(false);
      } finally {
        setAuthInitialized(true);
        setIsLoading(false);
      }
    };
    
    checkSession();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('[Auth Debug] Auth state change event:', _event);
        handleAuthStateChange(session);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('[Auth Debug] Error setting up auth listener:', error);
      setIsLoading(false);
      setAuthInitialized(true);
      return () => {};
    }
  }, []);

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
