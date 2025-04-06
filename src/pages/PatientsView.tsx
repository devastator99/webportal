
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AllPatientsList } from "@/components/dashboard/doctor/AllPatientsList";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PatientsView = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();

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
        <DashboardHeader 
          actionButton={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          }
        />
        <AllPatientsList />
      </div>
    </>
  );
};

export default PatientsView;
