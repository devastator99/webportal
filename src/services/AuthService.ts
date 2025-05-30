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
    console.log('AuthService initialized');
  }
  
  // Setup window event handlers to handle page close/refresh
  private setupWindowEventHandlers(): void {
    if (typeof window !== 'undefined' && !this.windowEventHandlersAttached) {
      window.addEventListener('beforeunload', () => {
        if (supabase.auth.getSession().then(({ data }) => data.session)) {
          this.clearInactivityTimer();
        }
      });
      
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.validateSession();
        }
      });
      
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

  // Fetch user role with improved retry logic and no aggressive timeout
  private async fetchUserRole(userId: string, setUserRole: (role: UserRole) => void): Promise<void> {
    const maxRetries = 3;
    let currentRetry = 0;
    
    while (currentRetry < maxRetries) {
      try {
        console.log(`Fetching user role for: ${userId} (attempt ${currentRetry + 1})`);
        
        const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
          lookup_user_id: userId
        });
        
        if (roleError) {
          console.error(`Error fetching user role (attempt ${currentRetry + 1}):`, roleError);
          
          // If it's the last retry, set null and break
          if (currentRetry === maxRetries - 1) {
            console.warn("Max retries reached, setting role to null");
            setUserRole(null);
            return;
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, currentRetry) * 1000));
          currentRetry++;
          continue;
        }
        
        if (roleData && roleData.length > 0) {
          const userRoleValue = roleData[0]?.role as UserRole || null;
          console.log("User role fetched successfully:", userRoleValue);
          setUserRole(userRoleValue);
          return;
        } else {
          console.warn(`No role data returned for user: ${userId}`);
          
          // For database trigger, role might not exist yet for very new users
          // Wait a bit and retry
          if (currentRetry < maxRetries - 1) {
            console.log("Role not found, retrying in case database trigger is still processing...");
            await new Promise(resolve => setTimeout(resolve, 2000));
            currentRetry++;
            continue;
          } else {
            console.warn("No role found after all retries");
            setUserRole(null);
            return;
          }
        }
      } catch (error) {
        console.error(`Exception in role fetching (attempt ${currentRetry + 1}):`, error);
        
        if (currentRetry === maxRetries - 1) {
          setUserRole(null);
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, currentRetry) * 1000));
        currentRetry++;
      }
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
    
    // Enhanced role setter that tracks loading state
    const enhancedSetUserRole = (role: UserRole) => {
      console.log("Setting user role:", role);
      setUserRole(role);
    };

    // Enhanced user setter that handles role loading
    const enhancedSetUser = (newUser: User | null) => {
      console.log("Setting user:", newUser?.email || 'null');
      setUser(newUser);
      if (newUser) {
        // Fetch role immediately for authenticated users
        this.fetchUserRole(newUser.id, enhancedSetUserRole);
      } else {
        enhancedSetUserRole(null);
      }
    };
    
    // Set up listeners BEFORE checking session
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
          enhancedSetUser(newSession.user);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
        } else if (event === 'USER_UPDATED' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
        }
      }
    );
    
    this.authStateSubscription = {
      unsubscribe: () => {
        if (data && data.subscription) {
          data.subscription.unsubscribe();
        }
      }
    };
    
    // Get initial session state
    this.getInitialSession(enhancedSetUser, setSession, enhancedSetUserRole, setIsLoading);
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
      } else {
        console.log("No initial session found");
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error fetching initial session:", error);
      setUserRole(null);
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
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.expires_at');
      localStorage.removeItem('supabase.auth.refresh_token');
      
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-provider-token');
      localStorage.removeItem('sb-auth-token');
      
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
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('auth_signout_channel');
        bc.postMessage('signout');
        setTimeout(() => bc.close(), 1000);
      } else {
        localStorage.setItem('auth_signout_broadcast', Date.now().toString());
        setTimeout(() => localStorage.removeItem('auth_signout_broadcast'), 1000);
      }
    } catch (error) {
      console.error('Error broadcasting sign out:', error);
    }
  }

  // Sign out user with proper transaction handling
  public async signOut(forceSignOut = false): Promise<void> {
    if (this.signingOut && !forceSignOut) {
      console.log("Already signing out, skipping redundant call");
      return this.signOutPromise;
    }
    
    this.signingOut = true;
    
    this.signOutPromise = (async () => {
      try {
        console.log("SignOut function called");
        
        this.clearInactivityTimer();
        toast.info("Signing out...");
        this.broadcastSignOut();
        
        let attempts = 0;
        const maxAttempts = 2;
        let error = null;
        
        while (attempts < maxAttempts) {
          try {
            await supabase.auth.signOut({
              scope: 'global'
            });
            console.log("Successfully signed out from Supabase");
            error = null;
            break;
          } catch (e) {
            error = e;
            attempts++;
            if (attempts < maxAttempts) {
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
        
        this.clearAuthLocalStorage();
        toast.success("Successfully signed out");
        
        setTimeout(() => {
          window.location.href = '/';
        }, 300);
      } catch (error) {
        console.error("Error signing out:", error);
        
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
        
        throw error;
      } finally {
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
