
import { useAuth } from "@/contexts/AuthContext";
import { NoRoleWarning } from "@/components/auth/NoRoleWarning";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { NutritionistDashboard } from "@/components/dashboard/NutritionistDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ReceptionDashboard } from "@/components/dashboard/ReceptionDashboard";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Dashboard = () => {
  const { user, userRole, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  console.log("Dashboard render:", { 
    user: user?.id, 
    userEmail: user?.email,
    userRole, 
    isLoading 
  });

  useEffect(() => {
    console.log("[Dashboard] useEffect triggered:", { 
      userId: user?.id, 
      userRole, 
      isLoading 
    });
    
    if (!isLoading && !user) {
      console.log("[Dashboard] No user found, redirecting to /");
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  // Render error state
  if (dashboardError) {
    return (
      <div className="container mx-auto px-4 py-8 mt-20">
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {dashboardError}
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
    );
  }

  // Show loading state
  if (isLoading) {
    console.log("[Dashboard] Showing loading skeleton");
    return <DashboardSkeleton />;
  }

  // After loading, if no user is found, useEffect will handle redirect
  if (!user) {
    console.log("[Dashboard] No user, returning null");
    return null;
  }

  // Handle no role case
  if (!userRole) {
    console.log("[Dashboard] No role assigned, showing NoRoleWarning");
    return <NoRoleWarning onSignOut={signOut} />;
  }

  console.log(`[Dashboard] Attempting to render ${userRole} dashboard`);
  
  // Render appropriate dashboard based on role with Navbar
  return (
    <div className="pt-16 md:pt-20">
      {(() => {
        try {
          switch (userRole) {
            case "doctor":
              console.log("[Dashboard] Rendering doctor dashboard");
              return <DoctorDashboard />;
            case "patient":
              console.log("[Dashboard] Rendering patient dashboard");
              return <PatientDashboard />;
            case "nutritionist":
              console.log("[Dashboard] Rendering nutritionist dashboard");
              return <NutritionistDashboard />;
            case "administrator":
              console.log("[Dashboard] Rendering admin dashboard");
              return <AdminDashboard />;
            case "reception":
              console.log("[Dashboard] Rendering reception dashboard");
              return <ReceptionDashboard />;
            default:
              console.log(`[Dashboard] Invalid role: ${userRole}, rendering NoRoleWarning`);
              return <NoRoleWarning onSignOut={signOut} />;
          }
        } catch (error) {
          console.error("[Dashboard] Error rendering dashboard:", error);
          toast({
            title: "Dashboard Error",
            description: `Failed to load dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive"
          });
          setDashboardError(`We couldn't load your dashboard correctly. This might be due to a role configuration issue or a temporary system problem.`);
          return null;
        }
      })()}
    </div>
  );
};

export default Dashboard;
