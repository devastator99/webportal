
import { useEffect, useState } from "react";
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
import { NutritionistAppLayout } from "@/layouts/NutritionistAppLayout";
import { AppLayout } from "@/layouts/AppLayout";

// Map user roles to their respective layouts and dashboards
const roleLayouts = {
  patient: {
    Layout: PatientAppLayout,
    Dashboard: PatientDashboard,
  },
  doctor: {
    Layout: DoctorAppLayout,
    Dashboard: DoctorDashboard,
  },
  nutritionist: {
    Layout: NutritionistAppLayout,
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
  const { user, userRole, isLoading, isLoadingRole, signOut, refreshUserRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roleRefreshAttempts, setRoleRefreshAttempts] = useState(0);
  const [hasTriedRoleRefresh, setHasTriedRoleRefresh] = useState(false);
  
  const MAX_ROLE_REFRESH_ATTEMPTS = 2;
  
  console.log("Dashboard render:", { 
    user: user?.id, 
    userEmail: user?.email,
    userRole, 
    isLoading,
    isLoadingRole,
    roleRefreshAttempts,
    hasTriedRoleRefresh
  });

  useEffect(() => {
    console.log("[Dashboard] useEffect triggered:", { 
      userId: user?.id, 
      userRole, 
      isLoading,
      isLoadingRole
    });
    
    // Only redirect if we're not loading and there's no user
    if (!isLoading && !user) {
      console.log("[Dashboard] No user found, redirecting to /");
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  // Controlled role refresh with attempt limiting
  useEffect(() => {
    if (!isLoading && !isLoadingRole && user && !userRole && !hasTriedRoleRefresh && roleRefreshAttempts < MAX_ROLE_REFRESH_ATTEMPTS) {
      console.log("[Dashboard] Attempting role refresh, attempt:", roleRefreshAttempts + 1);
      setRoleRefreshAttempts(prev => prev + 1);
      setHasTriedRoleRefresh(true);
      
      // Add a delay to prevent rapid refresh attempts
      setTimeout(() => {
        refreshUserRole().finally(() => {
          // Reset the flag after a delay to allow future attempts if needed
          setTimeout(() => {
            setHasTriedRoleRefresh(false);
          }, 5000);
        });
      }, 1000);
    }
  }, [user, userRole, isLoading, isLoadingRole, refreshUserRole, roleRefreshAttempts, hasTriedRoleRefresh]);

  // Show loading state while auth is loading or role is loading
  if (isLoading || (isLoadingRole && roleRefreshAttempts < MAX_ROLE_REFRESH_ATTEMPTS)) {
    console.log("[Dashboard] Showing loading skeleton - isLoading:", isLoading, "isLoadingRole:", isLoadingRole);
    return <DashboardSkeleton />;
  }

  // After loading, if no user is found, useEffect will handle redirect
  if (!user) {
    console.log("[Dashboard] No user, returning null");
    return null;
  }

  // Handle no role case - but only after loading is complete and we've tried refreshing
  if (!userRole) {
    console.log("[Dashboard] No role assigned after", roleRefreshAttempts, "attempts, showing NoRoleWarning");
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Role Assigned</AlertTitle>
            <AlertDescription>
              Your account does not have a role assigned. This might be because your registration is incomplete or there was an issue during setup.
            </AlertDescription>
          </Alert>
          <NoRoleWarning onSignOut={signOut} />
        </div>
      </AppLayout>
    );
  }

  console.log(`[Dashboard] Attempting to render ${userRole} dashboard`);
  
  // Render appropriate dashboard based on role
  try {
    // Get the layout and dashboard components for the current role
    const roleConfig = roleLayouts[userRole as keyof typeof roleLayouts];
    
    if (roleConfig) {
      const { Layout, Dashboard: RoleDashboard } = roleConfig;
      console.log(`[Dashboard] Rendering ${userRole} dashboard`);
      
      return (
        <Layout>
          <RoleDashboard />
        </Layout>
      );
    } else {
      // Fallback for unknown roles
      console.log(`[Dashboard] Invalid role: ${userRole}, rendering NoRoleWarning`);
      return (
        <AppLayout>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Role</AlertTitle>
            <AlertDescription>
              Your account has an unrecognized role: {userRole}. Please contact support.
            </AlertDescription>
          </Alert>
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
