
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { DoctorDashboard } from "@/components/dashboard/doctor/DoctorDashboard";
import { NutritionistDashboard } from "@/components/dashboard/NutritionistDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ReceptionDashboard } from "@/components/dashboard/ReceptionDashboard";
import { useNavigate } from "react-router-dom";
import { PatientAppLayout } from "@/layouts/PatientAppLayout";
import { DoctorAppLayout } from "@/layouts/DoctorAppLayout";
import { AdminAppLayout } from "@/layouts/AdminAppLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { RegistrationStatusChecker } from "@/components/auth/RegistrationStatusChecker";

const Dashboard = () => {
  const { user, userRole, isLoading, isLoadingRole } = useAuth();
  const navigate = useNavigate();
  
  console.log("Dashboard:", { user: user?.id, userRole, isLoading, isLoadingRole });

  useEffect(() => {
    // Only redirect unauthenticated users - do NOT redirect users in registration
    if (!isLoading && !user) {
      console.log("Dashboard: No user found, redirecting to auth");
      navigate("/auth", { replace: true });
      return;
    }
  }, [user, isLoading, navigate]);

  // Handle users without roles - but be careful not to interfere with registration
  useEffect(() => {
    if (!isLoading && !isLoadingRole && user && !userRole) {
      // Check if we're in a registration flow by looking at current path
      const currentPath = window.location.pathname;
      
      // Don't redirect if already on registration or auth pages
      if (currentPath.includes('/register') || currentPath.includes('/auth')) {
        console.log("Dashboard: User in registration flow, not redirecting");
        return;
      }
      
      console.log("Dashboard: User has no role and not in registration, redirecting to auth");
      navigate("/auth", { replace: true });
    }
  }, [user, userRole, isLoading, isLoadingRole, navigate]);

  // Show loading while auth or role is loading
  if (isLoading || isLoadingRole) {
    return <DashboardSkeleton />;
  }

  // No user - redirect will handle this
  if (!user) {
    return null;
  }

  // No role - redirect will handle this
  if (!userRole) {
    return null;
  }

  // Render dashboard based on role
  switch (userRole) {
    case 'patient':
      return (
        <PatientAppLayout>
          <RegistrationStatusChecker>
            <PatientDashboard />
          </RegistrationStatusChecker>
        </PatientAppLayout>
      );
    case 'doctor':
      return (
        <DoctorAppLayout>
          <DoctorDashboard />
        </DoctorAppLayout>
      );
    case 'nutritionist':
      return (
        <AppLayout>
          <NutritionistDashboard />
        </AppLayout>
      );
    case 'administrator':
      return (
        <AdminAppLayout>
          <AdminDashboard />
        </AdminAppLayout>
      );
    case 'reception':
      return (
        <AppLayout>
          <ReceptionDashboard />
        </AppLayout>
      );
    default:
      // For unknown roles, redirect to auth (not register)
      navigate("/auth", { replace: true });
      return null;
  }
};

export default Dashboard;
