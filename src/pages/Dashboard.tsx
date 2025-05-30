
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NoRoleWarning } from "@/components/auth/NoRoleWarning";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { DoctorDashboard } from "@/components/dashboard/doctor/DoctorDashboard";
import { NutritionistDashboard } from "@/components/dashboard/NutritionistDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ReceptionDashboard } from "@/components/dashboard/ReceptionDashboard";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { PatientAppLayout } from "@/layouts/PatientAppLayout";
import { DoctorAppLayout } from "@/layouts/DoctorAppLayout";
import { AdminAppLayout } from "@/layouts/AdminAppLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { RegistrationStatusChecker } from "@/components/auth/RegistrationStatusChecker";
import { useRegistrationState } from "@/hooks/useRegistrationState";

// Map user roles to their respective layouts and dashboards
const roleLayouts = {
  patient: {
    Layout: PatientAppLayout,
    Dashboard: ({ children }: { children?: React.ReactNode }) => (
      <RegistrationStatusChecker>
        <PatientDashboard />
        {children}
      </RegistrationStatusChecker>
    ),
  },
  doctor: {
    Layout: DoctorAppLayout,
    Dashboard: DoctorDashboard,
  },
  nutritionist: {
    Layout: AppLayout,
    Dashboard: NutritionistDashboard,
  },
  administrator: {
    Layout: AdminAppLayout,
    Dashboard: AdminDashboard,
  },
  reception: {
    Layout: AppLayout,
    Dashboard: ReceptionDashboard,
  },
};

const Dashboard = () => {
  const { user, userRole, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const redirectAttempts = useRef(0);
  const lastRedirectTime = useRef(0);
  
  const {
    isUserInActiveRegistration,
    debugMode
  } = useRegistrationState();
  
  console.log("Dashboard render:", { 
    user: user?.id, 
    userEmail: user?.email,
    userRole, 
    isLoading
  });

  // Enhanced redirect with safety checks
  const safeRedirect = (path: string, reason: string) => {
    const now = Date.now();
    const timeSinceLastRedirect = now - lastRedirectTime.current;
    
    // Prevent redirects if we just redirected recently (within 3 seconds)
    if (timeSinceLastRedirect < 3000) {
      if (debugMode) {
        console.log(`[Dashboard] Skipping redirect - too recent (${timeSinceLastRedirect}ms ago)`);
      }
      return;
    }

    // Prevent too many redirect attempts
    if (redirectAttempts.current >= 2) {
      if (debugMode) {
        console.log('[Dashboard] Too many redirect attempts, stopping');
      }
      return;
    }

    if (debugMode) {
      console.log(`[Dashboard] Safe redirect to ${path}: ${reason}`);
    }
    
    redirectAttempts.current++;
    lastRedirectTime.current = now;
    navigate(path, { replace: true });
  };

  useEffect(() => {
    if (debugMode) {
      console.log("[Dashboard] useEffect triggered:", { 
        userId: user?.id, 
        userRole, 
        isLoading
      });
    }
    
    // Only redirect if we're not loading and there's no user
    if (!isLoading && !user) {
      if (debugMode) {
        console.log("[Dashboard] No user found, redirecting to /auth");
      }
      safeRedirect("/auth", "No user authenticated");
      return;
    }
    
    // Check if user is in active registration flow - this takes priority
    if (user && isUserInActiveRegistration()) {
      if (debugMode) {
        console.log("[Dashboard] User in active registration, redirecting to /register");
      }
      safeRedirect("/register", "User in active registration");
      return;
    }
    
    // More lenient approach for users with no role - only redirect after a delay
    // This prevents immediate redirects for users who just completed registration
    if (user && !userRole && !isUserInActiveRegistration()) {
      if (debugMode) {
        console.log("[Dashboard] User has no role, checking if this is a new registration completion...");
      }
      
      // Check if user was just redirected from registration
      const fromRegistration = window.history.state?.from === 'registration';
      
      if (!fromRegistration) {
        // Add a delay to allow for auth state to settle
        const timeoutId = setTimeout(() => {
          if (debugMode) {
            console.log("[Dashboard] User has no role after delay, redirecting to /register");
          }
          safeRedirect("/register", "No user role assigned");
        }, 2000); // Increased delay to 2 seconds
        
        return () => clearTimeout(timeoutId);
      } else {
        if (debugMode) {
          console.log("[Dashboard] User just came from registration, giving more time for role to load");
        }
      }
    }
  }, [user, userRole, isLoading, navigate, isUserInActiveRegistration, debugMode]);

  // Show loading state while auth is loading
  if (isLoading) {
    if (debugMode) {
      console.log("[Dashboard] Showing loading skeleton - isLoading:", isLoading);
    }
    return <DashboardSkeleton />;
  }

  // After loading, if no user is found, useEffect will handle redirect
  if (!user) {
    if (debugMode) {
      console.log("[Dashboard] No user, returning null");
    }
    return null;
  }

  // If user is in active registration, useEffect will handle redirect
  if (isUserInActiveRegistration()) {
    if (debugMode) {
      console.log("[Dashboard] User in active registration, returning null (redirect will happen)");
    }
    return null;
  }

  // Handle no role case - but only after loading is complete and not in registration
  if (!userRole) {
    if (debugMode) {
      console.log("[Dashboard] No role assigned, showing NoRoleWarning");
    }
    return (
      <AppLayout>
        <NoRoleWarning onSignOut={signOut} />
      </AppLayout>
    );
  }

  if (debugMode) {
    console.log(`[Dashboard] Attempting to render ${userRole} dashboard`);
  }
  
  // Render appropriate dashboard based on role
  try {
    // Get the layout and dashboard components for the current role
    const roleConfig = roleLayouts[userRole as keyof typeof roleLayouts];
    
    if (roleConfig) {
      const { Layout, Dashboard: RoleDashboard } = roleConfig;
      if (debugMode) {
        console.log(`[Dashboard] Rendering ${userRole} dashboard`);
      }
      
      return (
        <Layout>
          <RoleDashboard />
        </Layout>
      );
    } else {
      // Fallback for unknown roles
      if (debugMode) {
        console.log(`[Dashboard] Invalid role: ${userRole}, rendering NoRoleWarning`);
      }
      return (
        <AppLayout>
          <NoRoleWarning onSignOut={signOut} />
        </AppLayout>
      );
    }
  } catch (error) {
    console.error("[Dashboard] Error rendering dashboard:", error);
    toast({
      title: "Dashboard Error",
      description: `Failed to load dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive"
    });
    
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 mt-20">
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              We couldn't load your dashboard correctly. This might be due to a role configuration issue or a temporary system problem.
            </AlertDescription>
          </Alert>
          <div className="flex justify-center mt-8">
            <button 
              onClick={() => window.location.reload()}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mr-4"
            >
              Retry
            </button>
            <button 
              onClick={() => signOut()}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }
};

export default Dashboard;
