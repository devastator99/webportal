
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChatInterface } from "../chat/ChatInterface";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { PatientStats } from "./patient/PatientStats";
import { AppointmentsList } from "./patient/AppointmentsList";
import { MedicalRecordsUpload } from "./patient/MedicalRecordsUpload";
import { Database } from "@/integrations/supabase/types";
import { DashboardHeader } from "./DashboardHeader";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type Appointment = {
  id: string;
  scheduled_at: string;
  status: string;
  doctor: {
    first_name: string;
    last_name: string;
  };
};

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: patientData, isLoading } = useQuery({
    queryKey: ["patient_dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");

      console.log("Fetching patient profile for user:", user.id);
      
      // First get the profile data
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw profileError;
      }

      if (!profile) {
        console.error("No profile found for user");
        throw new Error("No profile found");
      }

      console.log("Retrieved profile data:", profile);

      // Use the get_patient_appointments function to fetch appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .rpc('get_patient_appointments', {
          p_patient_id: user.id
        });

      if (appointmentsError) {
        console.error("Appointments fetch error:", appointmentsError);
        throw appointmentsError;
      }

      console.log("Raw appointments data:", appointments);

      // Transform the appointments to match our expected format
      const transformedAppointments = appointments.map(apt => ({
        id: apt.id,
        scheduled_at: apt.scheduled_at,
        status: 'scheduled', // Status is already filtered in the function
        doctor: {
          first_name: apt.doctor_first_name || '',
          last_name: apt.doctor_last_name || ''
        }
      })) as Appointment[];

      console.log("Transformed appointments:", transformedAppointments);

      return {
        profile: {
          first_name: profile.first_name ?? '',
          last_name: profile.last_name ?? ''
        },
        appointments: transformedAppointments
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 1
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Filter upcoming appointments - note that our RPC function already filters for scheduled status
  const upcomingAppointments = patientData?.appointments || [];

  return (
    <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
      <DashboardHeader />
      
      {/* Stats Row */}
      <PatientStats />

      {/* Main Content - Use similar grid layout to DoctorDashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <AppointmentsList appointments={upcomingAppointments} />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <MedicalRecordsUpload showUploadOnly />
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};
