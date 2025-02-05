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
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: userRole, isLoading, error } = useQuery({
    queryKey: ["user_role", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log("No user ID available for role query");
        return null;
      }
      
      try {
        console.log("Fetching role for user ID:", user.id);
        
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

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
        
        console.log("Retrieved user role:", data.role);
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
    enabled: !!user?.id,
    retry: 1,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (!user && !isLoading) {
      console.log("No user found, redirecting to auth");
      navigate("/auth");
      return;
    }

    if (error) {
      console.error("Dashboard error:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard. Please try logging in again.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [error, user, isLoading, navigate, toast]);

  if (isLoading) {
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

  if (!userRole) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold text-red-500">Access Error</h1>
        <p className="text-gray-600">
          Unable to determine your user role. Please try logging out and back in.
        </p>
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          Debug info:
          User ID: {user?.id}
          Role: {userRole || "No role assigned"}
        </pre>
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
          <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
          <p className="text-gray-600">
            You don't have the required permissions to access this page.
            Current role: {userRole || "No role assigned"}
          </p>
          <pre className="mt-4 p-4 bg-gray-100 rounded">
            Debug info:
            User ID: {user?.id}
            Role: {userRole}
          </pre>
        </div>
      );
  }
};

export default Dashboard;