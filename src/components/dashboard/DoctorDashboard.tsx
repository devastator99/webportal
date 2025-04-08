
import { useAuth } from "@/contexts/AuthContext";
import { AlternativeDoctorDashboard } from "@/components/dashboard/doctor/AlternativeDoctorDashboard";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  
  return <AlternativeDoctorDashboard />;
};
