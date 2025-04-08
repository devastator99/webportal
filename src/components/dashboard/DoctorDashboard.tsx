
import { useAuth } from "@/contexts/AuthContext";
import { DoctorDashboard as OriginalDoctorDashboard } from "@/components/dashboard/doctor/DoctorDashboard";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  
  return <OriginalDoctorDashboard />;
};
