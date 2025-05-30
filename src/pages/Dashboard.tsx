
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NoRoleWarning } from "@/components/auth/NoRoleWarning";
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
  const { user, userRole, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  
  console.log("Dashboard:", { user: user?.id, userRole, isLoading });

  useEffect(() => {
    // Simple redirect: no user = go to auth
    if (!isLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Show loading
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // No user - redirect will handle this
  if (!user) {
    return null;
  }

  // No role - show warning
  if (!userRole) {
    return (
      <AppLayout>
        <NoRoleWarning onSignOut={signOut} />
      </AppLayout>
    );
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
      return (
        <AppLayout>
          <NoRoleWarning onSignOut={signOut} />
        </AppLayout>
      );
  }
};

export default Dashboard;
