
import { AlternativeDoctorDashboard } from "@/components/dashboard/doctor/AlternativeDoctorDashboard";
import { useAuth } from "@/contexts/AuthContext";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  
  return <AlternativeDoctorDashboard />;
};

