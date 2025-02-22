
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

      // Then get appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_at,
          status,
          doctor:profiles!appointments_doctor_profile_fkey(first_name, last_name)
        `)
        .eq("patient_id", user.id)
        .order("scheduled_at", { ascending: true });

      if (appointmentsError) {
        console.error("Appointments fetch error:", appointmentsError);
        throw appointmentsError;
      }

      // Return explicitly typed data
      return {
        profile: {
          first_name: profile.first_name,
          last_name: profile.last_name
        },
        appointments: appointments || []
      };
    },
    enabled: !!user?.id,
    staleTime: 30000, // Cache data for 30 seconds
    retry: 1 // Only retry once if query fails
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Filter upcoming appointments - only get future appointments with 'scheduled' status
  const upcomingAppointments = patientData?.appointments.filter(a => 
    new Date(a.scheduled_at) > new Date() && a.status === 'scheduled'
  ) || [];

  const nextAppointmentDate = upcomingAppointments[0]?.scheduled_at ? 
    new Date(upcomingAppointments[0].scheduled_at).toLocaleDateString() : 
    null;

  console.log("Rendering PatientHeader with profile data:", patientData?.profile);

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
          <PatientStats 
            appointmentsCount={upcomingAppointments.length}
            nextAppointmentDate={nextAppointmentDate}
          />

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
