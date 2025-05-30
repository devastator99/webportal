
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
import { DashboardRegistrationHandler } from "@/components/dashboard/DashboardRegistrationHandler";

const Dashboard = () => {
  const { user, userRole, isLoading, isLoadingRole } = useAuth();
  const navigate = useNavigate();
  
  console.log("Dashboard:", { user: user?.id, userRole, isLoading, isLoadingRole });

  useEffect(() => {
    // Only redirect unauthenticated users after loading is complete
    if (!isLoading && !user) {
      console.log("Dashboard: No user found, redirecting to auth");
      navigate("/auth", { replace: true });
      return;
    }
  }, [user, isLoading, navigate]);

  // FIXED: Only redirect users without roles AFTER both auth and role loading are complete
  // This prevents the redirect loop where users get sent back to auth while role is still loading
  useEffect(() => {
    if (!isLoading && !isLoadingRole && user && !userRole) {
      console.log("Dashboard: User has no role after loading complete, redirecting to auth");
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

  // Render dashboard based on role with registration completion handler
  switch (userRole) {
    case 'patient':
      return (
        <PatientAppLayout>
          <DashboardRegistrationHandler userRole={userRole}>
            <PatientDashboard />
          </DashboardRegistrationHandler>
        </PatientAppLayout>
      );
    case 'doctor':
      return (
        <DoctorAppLayout>
          <DashboardRegistrationHandler userRole={userRole}>
            <DoctorDashboard />
          </DashboardRegistrationHandler>
        </DoctorAppLayout>
      );
    case 'nutritionist':
      return (
        <AppLayout>
          <DashboardRegistrationHandler userRole={userRole}>
            <NutritionistDashboard />
          </DashboardRegistrationHandler>
        </AppLayout>
      );
    case 'administrator':
      return (
        <AdminAppLayout>
          <DashboardRegistrationHandler userRole={userRole}>
            <AdminDashboard />
          </DashboardRegistrationHandler>
        </AdminAppLayout>
      );
    case 'reception':
      return (
        <AppLayout>
          <DashboardRegistrationHandler userRole={userRole}>
            <ReceptionDashboard />
          </DashboardRegistrationHandler>
        </AppLayout>
      );
    default:
      // For unknown roles, redirect to auth
      navigate("/auth", { replace: true });
      return null;
  }
};

export default Dashboard;
