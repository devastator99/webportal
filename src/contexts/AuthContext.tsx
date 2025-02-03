import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const clearAuthData = async () => {
    try {
      // Clear user state
      setUser(null);
      
      // Clear all Supabase-related items from localStorage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem(`sb-${process.env.VITE_SUPABASE_PROJECT_ID}-auth-token`);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Navigate to home page
      navigate("/");
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error("Error during sign out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while signing out. Please try again.",
      });
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (sessionError.message.includes("refresh_token_not_found")) {
            await clearAuthData();
          } else {
            throw sessionError;
          }
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error: any) {
        console.error("Error checking auth session:", error);
        toast({
          variant: "destructive",
          title: "Session Error",
          description: "Your session has expired. Please sign in again.",
        });
        await clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_OUT') {
        await clearAuthData();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
        if (window.location.pathname === '/auth') {
          navigate("/");
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
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