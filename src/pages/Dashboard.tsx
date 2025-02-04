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
      if (!user?.id) return null;
      
      console.log("Fetching role for user:", user.id); // Debug log
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        throw error;
      }
      
      console.log("Retrieved user role:", data?.role); // Debug log
      return data?.role;
    },
    enabled: !!user?.id,
    retry: 1,
  });

  useEffect(() => {
    if (error) {
      console.error("Dashboard error:", error); // Debug log
      toast({
        title: "Error",
        description: "Failed to load dashboard. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Redirect to auth if no user
  useEffect(() => {
    if (!user && !isLoading) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

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

  // Add debug logs
  console.log("Current user:", user);
  console.log("Current user role:", userRole);

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
        </div>
      );
  }
};

export default Dashboard;