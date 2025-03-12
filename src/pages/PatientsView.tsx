
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AllPatientsList } from "@/components/dashboard/doctor/AllPatientsList";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
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

  // Create the action button to pass to the header
  const actionButton = (
    <ScheduleAppointment callerRole="doctor">
      <Button 
        className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-2 shadow-md text-sm"
        size="sm"
      >
        <Calendar className="h-4 w-4" />
        <span>Schedule</span>
      </Button>
    </ScheduleAppointment>
  );

  console.log("Rendering PatientsView component");

  return (
    <>
      <Navbar />
      <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
        <DashboardHeader actionButton={actionButton} />
        <AllPatientsList />
      </div>
    </>
  );
};

export default PatientsView;
