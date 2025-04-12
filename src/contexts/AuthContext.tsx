import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

// Define valid role types
export type UserRoleType = "patient" | "doctor" | "nutritionist" | "administrator" | "reception" | "aibot";

interface AuthContextProps {
  user: User | null;
  userRole: string | null;
  session: Session | null;
  isLoading: boolean;
  initialized: boolean;
  login: (email: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: string) => Promise<any>;
  signOut: () => Promise<void>;
  forceSignOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (firstName: string, lastName: string) => Promise<void>;
  resetInactivityTimer: () => void;
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
  forceSignOut: async () => {},
  refreshUser: async () => {},
  updateUser: async () => {},
  resetInactivityTimer: () => {},
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [inactivityTimeout, setInactivityTimeout] = useState<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Function to fetch user role using a direct query
  const fetchUserRole = async (userId: string) => {
    try {
      console.log("Fetching user role for:", userId);
      // Use a direct query from user_roles table
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      console.log("Fetched role data:", data);
      return data?.role;
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      return null;
    }
  };

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    // Clear any existing timeout
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
    }
    
    // Only set a new timeout if the user is logged in
    if (user) {
      // Set a new timeout - log out after 30 minutes of inactivity
      const timeout = setTimeout(() => {
        console.log("User inactive for too long, logging out");
        signOut();
      }, 30 * 60 * 1000); // 30 minutes
      
      setInactivityTimeout(timeout);
    }
  }, [user, inactivityTimeout]);

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
        // Create user role entry - use a single object, not an array
        await supabase.from('user_roles').insert({
          user_id: data.user.id, 
          role: role as UserRoleType
        });

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
      setSession(null);
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

  // Force signout for admin use
  const forceSignOut = async () => {
    setIsLoading(true);
    try {
      // Add any additional force logout logic here if needed
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      setSession(null);
      navigate('/auth');
      toast({
        title: "Force logout successful",
        description: "You have been logged out by admin action",
      });
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

  // Update the refreshUser function to use our direct query and add more logging
  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Refreshing user data");
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      setSession(currentSession);
      
      if (currentUser) {
        console.log("Found authenticated user:", currentUser.id);
        setUser(currentUser);
        
        // Fetch user role using the direct query function
        const role = await fetchUserRole(currentUser.id);
        console.log("Fetched user role:", role);
        
        if (role) {
          setUserRole(role);
        } else {
          console.warn("No role found for user:", currentUser.id);
          setUserRole(null);
        }
      } else {
        console.log("No authenticated user found");
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        const role = await fetchUserRole(session.user.id);
        if (role) {
          setUserRole(role);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
      // Clear any inactivity timeout when component unmounts
      if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
      }
    };
  }, [refreshUser, inactivityTimeout]);

  // Start the inactivity timer when the user logs in
  useEffect(() => {
    if (user) {
      resetInactivityTimer();
    }
  }, [user, resetInactivityTimer]);

  const contextValue: AuthContextProps = {
    user,
    userRole,
    session,
    isLoading,
    initialized,
    login,
    signUp,
    signOut,
    forceSignOut,
    refreshUser,
    updateUser,
    resetInactivityTimer,
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
