
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChatInterface } from "../chat/ChatInterface";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { PatientHeader } from "./patient/PatientHeader";
import { PatientStats } from "./patient/PatientStats";
import { AppointmentsList } from "./patient/AppointmentsList";
import { MedicalRecordsUpload } from "./patient/MedicalRecordsUpload";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];

type AppointmentWithDoctor = {
  id: string;
  scheduled_at: string;
  status: string;
  doctor_id: string;
  doctor_first_name: string | null;
  doctor_last_name: string | null;
}

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

      // Get appointments with doctor profiles using explicit join
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_at,
          status,
          profiles!appointments_doctor_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('patient_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (appointmentsError) {
        console.error("Appointments fetch error:", appointmentsError);
        throw appointmentsError;
      }

      console.log("Raw appointments data:", appointmentsData);

      // Transform the appointments data with explicit typing
      const appointments = appointmentsData.map(appt => ({
        id: appt.id,
        scheduled_at: appt.scheduled_at,
        status: appt.status,
        doctor: {
          first_name: (appt.profiles as any)?.first_name ?? '',
          last_name: (appt.profiles as any)?.last_name ?? ''
        }
      })) as Appointment[];

      console.log("Transformed appointments:", appointments);

      return {
        profile: {
          first_name: profile.first_name ?? '',
          last_name: profile.last_name ?? ''
        },
        appointments
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 1
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Filter upcoming appointments
  const upcomingAppointments = patientData?.appointments?.filter(a => 
    new Date(a.scheduled_at) > new Date() && a.status === 'scheduled'
  ) || [];

  return (
    <div className="min-h-screen">
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b">
        <div className="container mx-auto p-4">
          <PatientHeader 
            firstName={patientData?.profile?.first_name}
            lastName={patientData?.profile?.last_name}
          />
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="pt-24 pb-6 space-y-8">
          {/* Stats Row */}
          <PatientStats />

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - View Content */}
            <div className="flex-1">
              <AppointmentsList appointments={upcomingAppointments} />
            </div>

            {/* Right Column - Actions */}
            <div className="lg:w-[400px] space-y-6">
              <MedicalRecordsUpload showUploadOnly />
              <ChatInterface />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
