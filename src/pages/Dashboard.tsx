
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
import { useRegistrationState } from "@/hooks/useRegistrationState";

const Dashboard = () => {
  const { user, userRole, isLoading, isLoadingRole } = useAuth();
  const navigate = useNavigate();
  const { isUserInActiveRegistration } = useRegistrationState();
  
  console.log("Dashboard:", { user: user?.id, userRole, isLoading, isLoadingRole });

  useEffect(() => {
    // Check if user is in active registration flow - if so, redirect to registration
    if (!isLoading && user && isUserInActiveRegistration()) {
      console.log("Dashboard: User in active registration, redirecting to registration");
      navigate("/register", { replace: true });
      return;
    }

    // Only redirect unauthenticated users - do NOT redirect users in registration
    if (!isLoading && !user) {
      console.log("Dashboard: No user found, redirecting to auth");
      navigate("/auth", { replace: true });
      return;
    }
  }, [user, isLoading, navigate, isUserInActiveRegistration]);

  // Handle users without roles - but ONLY if they're not in active registration
  useEffect(() => {
    if (!isLoading && !isLoadingRole && user && !userRole && !isUserInActiveRegistration()) {
      console.log("Dashboard: User has no role and not in registration, redirecting to auth");
      navigate("/auth", { replace: true });
    }
  }, [user, userRole, isLoading, isLoadingRole, navigate, isUserInActiveRegistration]);

  // Show loading while auth or role is loading
  if (isLoading || isLoadingRole) {
    return <DashboardSkeleton />;
  }

  // No user - redirect will handle this
  if (!user) {
    return null;
  }

  // User in active registration - redirect will handle this
  if (isUserInActiveRegistration()) {
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
