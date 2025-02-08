
import { useAuth, NoRoleWarning } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { NutritionistDashboard } from "@/components/dashboard/NutritionistDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
          .rpc('get_user_role', { checking_user_id: user.id })
          .maybeSingle();

        console.log("Role query response:", { data, error });

        if (error) {
          console.error("Error fetching user role:", error);
          throw error;
        }

        if (!data) {
          console.log("No role found for user:", user.id);
          return null;
        }
        
        console.log("Successfully retrieved user role:", data.role);
        return data.role;
      } catch (error: any) {
        console.error("Role query error:", error);
        throw error;
      }
    },
    enabled: !!user?.id && isInitialized,
    staleTime: 30000, // Cache for 30 seconds
    cacheTime: 60000, // Keep in cache for 1 minute
    retry: 1,
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

  // Early return for initial loading state
  if (!isInitialized || authLoading) {
    console.log("Waiting for auth initialization...");
    return <DashboardSkeleton />;
  }

  // After initialization, if no user is found, redirect will happen in useEffect
  if (!user) {
    console.log("No user found in Dashboard");
    return null;
  }

  // Show loading state while fetching role
  if (roleLoading) {
    console.log("Loading user role...");
    return <DashboardSkeleton />;
  }

  // Handle no role case
  if (!userRole) {
    console.log("No role found for user");
    return <NoRoleWarning onSignOut={signOut} />;
  }

  console.log("Rendering dashboard for role:", userRole);

  // Render appropriate dashboard based on role
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
      return <NoRoleWarning onSignOut={signOut} />;
  }
};

export default Dashboard;
