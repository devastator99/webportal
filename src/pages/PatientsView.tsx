
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AllPatientsList } from "@/components/dashboard/doctor/AllPatientsList";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Navbar } from "@/components/Navbar";

const PatientsView = () => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <>
        <Navbar />
        <DashboardSkeleton />
      </>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (userRole !== "doctor") {
    return <Navigate to="/dashboard" replace />;
  }

  console.log("Rendering PatientsView component");

  return (
    <>
      <Navbar />
      <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
        <DashboardHeader />
        <AllPatientsList />
      </div>
    </>
  );
};

export default PatientsView;
