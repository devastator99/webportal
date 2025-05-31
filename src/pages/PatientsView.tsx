
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AllPatientsList } from "@/components/dashboard/doctor/AllPatientsList";
import { DoctorAppLayout } from "@/layouts/DoctorAppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PatientsView = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (userRole !== "doctor") {
    return <Navigate to="/dashboard" replace />;
  }

  console.log("Rendering PatientsView component");

  return (
    <DoctorAppLayout 
      showHeader={true} 
      title="All Patients"
      description="View and manage your assigned patients"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <AllPatientsList />
      </div>
    </DoctorAppLayout>
  );
};

export default PatientsView;
