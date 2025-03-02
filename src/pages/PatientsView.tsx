
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AllPatientsList } from "@/components/dashboard/doctor/AllPatientsList";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const PatientsView = () => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (userRole !== "doctor") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
      <DashboardHeader />
      <AllPatientsList />
    </div>
  );
};

export default PatientsView;
