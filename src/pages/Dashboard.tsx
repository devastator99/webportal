
import { useAuth } from "@/contexts/AuthContext";
import { NoRoleWarning } from "@/components/auth/NoRoleWarning";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { NutritionistDashboard } from "@/components/dashboard/NutritionistDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, userRole, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log("Dashboard render:", { user: user?.id, userRole, isLoading });

  useEffect(() => {
    if (!isLoading && !user) {
      console.log("No user found, redirecting to /");
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  // Show loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // After loading, if no user is found, useEffect will handle redirect
  if (!user) {
    return null;
  }

  // Handle no role case
  if (!userRole) {
    return <NoRoleWarning onSignOut={signOut} />;
  }

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
