
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { NutritionistDashboard } from "@/components/dashboard/NutritionistDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Dashboard = () => {
  const { user, isLoading: authLoading, isInitialized, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log("Dashboard render - Current state:", {
    user,
    authLoading,
    isInitialized,
    timestamp: new Date().toISOString()
  });

  const { data: userRole, isLoading: roleLoading, error } = useQuery({
    queryKey: ["user_role", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log("No user ID available for role query");
        return null;
      }
      
      try {
        console.log("Starting role fetch for user ID:", user.id);
        
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        console.log("Role query response:", { data, error });

        if (error) {
          console.error("Error fetching user role:", error);
          throw error;
        }

        if (!data) {
          console.log("No role found for user:", user.id);
          toast({
            title: "No Role Found",
            description: "Your account doesn't have a role assigned. Please contact support.",
            variant: "destructive",
          });
          return null;
        }
        
        console.log("Successfully retrieved user role:", data.role);
        return data.role;
      } catch (error: any) {
        console.error("Role query error:", error);
        toast({
          title: "Error Loading Role",
          description: "Failed to load your user role. Please try logging in again.",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!user?.id && isInitialized,
    retry: 1,
    retryDelay: 1000,
  });

  useEffect(() => {
    console.log("Dashboard useEffect - Current state:", {
      user: user?.id,
      authLoading,
      roleLoading,
      userRole,
      isInitialized,
      error: error?.message
    });

    if (isInitialized && !user && !authLoading) {
      console.log("No authenticated user found, redirecting to auth");
      navigate("/");
      return;
    }

    if (error) {
      console.error("Dashboard error:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard. Please try logging in again.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [error, user, authLoading, isInitialized, navigate, toast]);

  if (authLoading || roleLoading) {
    console.log("Dashboard is loading... States:", { authLoading, roleLoading });
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("No user found in Dashboard");
    return null;
  }

  if (!userRole) {
    console.log("No user role found. User info:", {
      id: user?.id,
      email: user?.email
    });
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Error</h1>
          <p className="text-gray-600 mb-6">
            Your account doesn't have any role assigned. Please contact support or sign out and try again with a different account.
          </p>
          <Button 
            onClick={signOut}
            variant="outline" 
            className="border-destructive text-destructive hover:bg-destructive/10 gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
          <pre className="mt-6 p-4 bg-gray-100 rounded text-sm">
            Debug info:{"\n"}
            User ID: {user?.id}{"\n"}
            Email: {user?.email}
          </pre>
        </div>
      </div>
    );
  }

  console.log("Rendering dashboard with role:", userRole);

  switch (userRole) {
    case "doctor":
      return <DoctorDashboard />;
    case "patient":
      return <PatientDashboard />;
    case "nutritionist":
      return <NutritionistDashboard />;
    case "administrator":
      return <AdminDashboard />;
    default:
      return (
        <div className="container mx-auto p-6">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
            <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You don't have the required permissions to access this page.
              Current role: {userRole || "No role assigned"}
            </p>
            <Button 
              onClick={signOut}
              variant="outline" 
              className="border-destructive text-destructive hover:bg-destructive/10 gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
            <pre className="mt-6 p-4 bg-gray-100 rounded text-sm">
              Debug info:{"\n"}
              User ID: {user?.id}{"\n"}
              Role: {userRole}
            </pre>
          </div>
        </div>
      );
  }
};

export default Dashboard;
