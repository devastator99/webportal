
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type UserRole = 'patient' | 'doctor' | 'nutritionist' | 'administrator' | 'reception' | null;

/**
 * AuthService - Singleton service for centralized authentication management
 * Handles user authentication, session management, and auth state synchronization
 */
class AuthService {
  private static instance: AuthService;
  private authStateSubscription: { unsubscribe: () => void } | null = null;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private signingOut = false;
  private signOutPromise: Promise<void> | null = null;
  
  // Private constructor for singleton pattern
  private constructor() {
    this.setupSupabaseClient();
  }

  // Get singleton instance
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Configure Supabase client for optimal auth persistence
  private setupSupabaseClient(): void {
    // Service is using the already configured supabase client
    console.log('AuthService initialized');
  }

  // Initialize auth state listeners
  public initializeAuth(
    setUser: (user: User | null) => void,
    setSession: (session: Session | null) => void,
    setUserRole: (role: UserRole) => void,
    setIsLoading: (loading: boolean) => void
  ): void {
    console.log('Initializing auth state');
    
    // Always set up listeners BEFORE checking session
    this.authStateSubscription = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state change:", event);
        
        if (event === 'SIGNED_OUT') {
          console.log("User signed out, clearing auth state");
          setSession(null);
          setUser(null);
          setUserRole(null);
          return;
        }
        
        if (event === 'SIGNED_IN' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          // Fetch user role on sign in - using setTimeout to prevent deadlock
          if (newSession.user) {
            // Use setTimeout to prevent potential deadlock
            setTimeout(async () => {
              try {
                const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
                  lookup_user_id: newSession.user.id
                });
                
                if (!roleError && roleData) {
                  const userRoleValue = roleData[0]?.role as UserRole || null;
                  setUserRole(userRoleValue);
                  console.log("User role on sign in:", userRoleValue);
                } else if (roleError) {
                  console.error("Error fetching user role on sign in:", roleError);
                }
              } catch (error) {
                console.error("Error in role handling:", error);
              }
            }, 0);
          }
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
        } else if (event === 'USER_UPDATED' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
        }
      }
    );
    
    // Get initial session state
    this.getInitialSession(setUser, setSession, setUserRole, setIsLoading);
  }

  // Get initial session from localStorage
  private async getInitialSession(
    setUser: (user: User | null) => void,
    setSession: (session: Session | null) => void,
    setUserRole: (role: UserRole) => void,
    setIsLoading: (loading: boolean) => void
  ): Promise<void> {
    try {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (initialSession) {
        console.log("Initial session found", initialSession.user?.email);
        setSession(initialSession);
        setUser(initialSession.user);
        
        // Fetch user role
        if (initialSession.user) {
          try {
            const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
              lookup_user_id: initialSession.user.id
            });
            
            if (!roleError && roleData) {
              const role = roleData[0]?.role as UserRole || null;
              setUserRole(role);
              console.log("User role set:", role);
            } else if (roleError) {
              console.error("Error fetching user role:", roleError);
            }
          } catch (error) {
            console.error("Error fetching user role:", error);
          }
        }
      } else {
        console.log("No initial session found");
      }
    } catch (error) {
      console.error("Error fetching initial session:", error);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Set up inactivity timer
  public setupInactivityTimer(signOutFunction: () => Promise<void>): void {
    this.clearInactivityTimer();
    
    this.inactivityTimer = setTimeout(() => {
      signOutFunction();
      toast.info("You have been signed out due to inactivity");
    }, this.INACTIVITY_TIMEOUT);
  }
  
  // Reset inactivity timer
  public resetInactivityTimer(signOutFunction: () => Promise<void>): void {
    this.clearInactivityTimer();
    this.setupInactivityTimer(signOutFunction);
  }
  
  // Clear inactivity timer
  public clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }
  
  // Check if sign out is in progress
  public isSigningOut(): boolean {
    return this.signingOut;
  }

  // Sign out user with proper transaction handling
  public async signOut(forceSignOut = false): Promise<void> {
    // Prevent multiple sign-out attempts running simultaneously
    if (this.signingOut && !forceSignOut) {
      console.log("Already signing out, skipping redundant call");
      return this.signOutPromise;
    }
    
    // Create a single signOut promise that can be returned for concurrent calls
    this.signingOut = true;
    
    this.signOutPromise = (async () => {
      try {
        console.log("SignOut function called");
        
        // Clear inactivity timer first
        this.clearInactivityTimer();
        
        toast.info("Signing out...");
        
        // Sign out from Supabase with retry
        let attempts = 0;
        const maxAttempts = 2;
        let error = null;
        
        while (attempts < maxAttempts) {
          try {
            await supabase.auth.signOut({
              scope: 'global' // Sign out from all devices/tabs
            });
            console.log("Successfully signed out from Supabase");
            error = null;
            break;
          } catch (e) {
            error = e;
            attempts++;
            if (attempts < maxAttempts) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 500));
              console.log(`Retrying sign out, attempt ${attempts}`);
            }
          }
        }
        
        if (error) {
          console.error("Error signing out from Supabase after retries:", error);
          toast.error("Error signing out. Refreshing the page...");
          throw error;
        }
        
        // Clear any local storage items that might contain auth state
        localStorage.removeItem('supabase.auth.token');
        
        // Navigate after successful sign out with delay to ensure state updates
        // are processed
        toast.success("Successfully signed out");
        
        // Return to landing page
        setTimeout(() => {
          window.location.href = '/';
        }, 300);
      } catch (error) {
        console.error("Error signing out:", error);
        
        // Force redirect on error to ensure user is not stuck
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
        
        throw error;
      } finally {
        // Reset signing out flag after a delay to prevent race conditions
        setTimeout(() => {
          this.signingOut = false;
          this.signOutPromise = null;
        }, 1000);
      }
    })();
    
    return this.signOutPromise;
  }
  
  // Clean up when service is no longer needed
  public cleanup(): void {
    if (this.authStateSubscription) {
      this.authStateSubscription.unsubscribe();
      this.authStateSubscription = null;
    }
    this.clearInactivityTimer();
  }
}

export default AuthService;
