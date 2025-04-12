
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

interface AuthContextProps {
  user: User | null;
  userRole: string | null;
  session: Session | null;
  isLoading: boolean;
  initialized: boolean;
  login: (email: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (firstName: string, lastName: string) => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  userRole: null,
  session: null,
  isLoading: true,
  initialized: false,
  login: async () => {},
  signUp: async () => Promise.resolve(),
  signOut: async () => {},
  refreshUser: async () => {},
  updateUser: async () => {},
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Simplified function to fetch user role directly from the user_roles table
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      return data.role;
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      return null;
    }
  };

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      toast({
        title: "Check your email",
        description: "We've sent you a magic link to log in.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.error_description || error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, role: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return { error: error.message };
      }

      if (data.user) {
        // Create user role entry
        await supabase.from('user_roles').insert([
          { user_id: data.user.id, role: role },
        ]);

        // Update user metadata
        await supabase.auth.updateUser({
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
          },
        });

        toast({
          title: "Success",
          description: "Account created successfully. Please check your email to verify your account.",
        });
        navigate('/auth');
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update the refreshUser function to use direct table query
  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch user role directly from the user_roles table
        const role = await fetchUserRole(currentUser.id);
        setUserRole(role);
        
        console.log("User authenticated with role:", role);
      } else {
        setUser(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = async (firstName: string, lastName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (error) {
        console.error("Update user error:", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Optimistically update the user object in the context
        setUser((prevUser) => {
          if (prevUser && prevUser.user_metadata) {
            return {
              ...prevUser,
              user_metadata: {
                ...prevUser.user_metadata,
                first_name: firstName,
                last_name: lastName,
              },
            };
          }
          return prevUser;
        });
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      }
    } catch (error: any) {
      console.error("Update user error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      await refreshUser();
      setInitialized(true);
    };

    initializeAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        refreshUser();
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [refreshUser]);

  const contextValue: AuthContextProps = {
    user,
    userRole,
    session: supabase.auth.session(),
    isLoading,
    initialized,
    login,
    signUp,
    signOut,
    refreshUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
