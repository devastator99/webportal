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
  private windowEventHandlersAttached = false;
  
  // Private constructor for singleton pattern
  private constructor() {
    this.setupSupabaseClient();
    this.setupWindowEventHandlers();
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
  
  // Setup window event handlers to handle page close/refresh
  private setupWindowEventHandlers(): void {
    if (typeof window !== 'undefined' && !this.windowEventHandlersAttached) {
      // Handle beforeunload event (page close/refresh)
      window.addEventListener('beforeunload', () => {
        // Only attempt cleanup if user is logged in
        if (supabase.auth.getSession().then(({ data }) => data.session)) {
          // We don't want to block page unload with async operations
          // Just clear local timers and state
          this.clearInactivityTimer();
        }
      });
      
      // Handle visibility change (tab switching)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          // When tab becomes visible, validate the session
          this.validateSession();
        }
      });
      
      // Track that handlers are attached
      this.windowEventHandlersAttached = true;
      console.log('Window event handlers attached for auth state management');
    }
  }
  
  // Validate the current session
  private async validateSession(): Promise<boolean> {
    try {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
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
    const { data } = supabase.auth.onAuthStateChange(
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
                console.log("Fetching user role for:", newSession.user.id);
                const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
                  lookup_user_id: newSession.user.id
                });
                
                if (!roleError && roleData && roleData.length > 0) {
                  const userRoleValue = roleData[0]?.role as UserRole || null;
                  console.log("User role fetched:", userRoleValue);
                  setUserRole(userRoleValue);
                } else if (roleError) {
                  console.error("Error fetching user role on sign in:", roleError);
                  setUserRole(null);
                } else {
                  console.warn("No role data returned for user:", newSession.user.id);
                  setUserRole(null);
                }
              } catch (error) {
                console.error("Error in role handling:", error);
                setUserRole(null);
              }
            }, 100); // Small delay to ensure everything is set up
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
    
    // Create a proper subscription object with unsubscribe method
    this.authStateSubscription = {
      unsubscribe: () => {
        if (data && data.subscription) {
          data.subscription.unsubscribe();
        }
      }
    };
    
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
            console.log("Fetching initial user role for:", initialSession.user.id);
            const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
              lookup_user_id: initialSession.user.id
            });
            
            if (!roleError && roleData && roleData.length > 0) {
              const role = roleData[0]?.role as UserRole || null;
              console.log("Initial user role set:", role);
              setUserRole(role);
            } else if (roleError) {
              console.error("Error fetching initial user role:", roleError);
              setUserRole(null);
            } else {
              console.warn("No initial role data returned for user:", initialSession.user.id);
              setUserRole(null);
            }
          } catch (error) {
            console.error("Error fetching initial user role:", error);
            setUserRole(null);
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

  // Clear all auth-related localStorage items
  private clearAuthLocalStorage(): void {
    try {
      // Clear Supabase-specific items
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.expires_at');
      localStorage.removeItem('supabase.auth.refresh_token');
      
      // Clear potential old format items
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-provider-token');
      localStorage.removeItem('sb-auth-token');
      
      // Clear project-specific items (use the correct project ref)
      const projectRef = 'hcaqodjylicmppxcbqbh';
      localStorage.removeItem(`sb-${projectRef}-auth-token`);
      localStorage.removeItem(`sb-${projectRef}-provider-token`);
      localStorage.removeItem(`sb-${projectRef}-access-token`);
      localStorage.removeItem(`sb-${projectRef}-refresh-token`);
      
      console.log('Auth localStorage items cleared');
    } catch (error) {
      console.error('Error clearing auth localStorage:', error);
    }
  }
  
  // Broadcast sign-out event to other tabs
  private broadcastSignOut(): void {
    try {
      // Use BroadcastChannel API if available
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('auth_signout_channel');
        bc.postMessage('signout');
        setTimeout(() => bc.close(), 1000);
      } else {
        // Fallback for browsers without BroadcastChannel API
        localStorage.setItem('auth_signout_broadcast', Date.now().toString());
        setTimeout(() => localStorage.removeItem('auth_signout_broadcast'), 1000);
      }
    } catch (error) {
      console.error('Error broadcasting sign out:', error);
    }
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
        
        // Broadcast sign-out event to other tabs
        this.broadcastSignOut();
        
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
        this.clearAuthLocalStorage();
        
        // Return to landing page
        toast.success("Successfully signed out");
        
        // Navigate after successful sign out with delay to ensure state updates
        // are processed
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
