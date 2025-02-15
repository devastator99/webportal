import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ChatInterface } from "../../chat/ChatInterface";
import { DashboardSkeleton } from "../DashboardSkeleton";
import { PatientHeader } from "./PatientHeader";
import { PatientStats } from "./PatientStats";
import { AppointmentsList } from "./AppointmentsList";
import { MedicalRecordsList } from "./MedicalRecordsList";
import { PatientReports } from "./PatientReports";

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: patientData, isLoading } = useQuery({
    queryKey: ["patient_dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");

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

      // Then get appointments, medical records and reports count
      const [
        { data: appointments, error: appointmentsError },
        { data: medicalRecords, error: medicalRecordsError },
        { data: medicalReports, error: reportsError }
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select(`
            id,
            scheduled_at,
            status,
            doctor:profiles!appointments_doctor_profile_fkey(
              first_name, 
              last_name,
              user_roles!inner (role)
            )
          `)
          .eq("patient_id", user.id)
          .eq("doctor.user_roles.role", "doctor")
          .order("scheduled_at", { ascending: true }),
        supabase
          .from("medical_records")
          .select("*")
          .eq("patient_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("medical_documents")
          .select("*")
          .order("created_at", { ascending: false })
      ]);

      if (appointmentsError) throw appointmentsError;
      if (medicalRecordsError) throw medicalRecordsError;
      if (reportsError) throw reportsError;

      return {
        profile,
        appointments: appointments || [],
        medicalRecords: medicalRecords || [],
        medicalReports: medicalReports || []
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const scheduledAppointments = patientData?.appointments.filter(a => a.status === 'scheduled') || [];
  const nextAppointmentDate = scheduledAppointments.length > 0 
    ? new Date(scheduledAppointments[0].scheduled_at).toLocaleDateString()
    : null;

  return (
    <div className="min-h-screen pt-20">
      <div className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b">
        <div className="container mx-auto p-4">
          <PatientHeader 
            firstName={patientData?.profile?.first_name}
            lastName={patientData?.profile?.last_name}
          />
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        <PatientStats 
          appointmentsCount={scheduledAppointments.length}
          medicalRecordsCount={patientData?.medicalRecords.length || 0}
          nextAppointmentDate={nextAppointmentDate}
          reportsCount={patientData?.medicalReports.length || 0}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <AppointmentsList appointments={scheduledAppointments} />
            <MedicalRecordsList records={patientData?.medicalRecords || []} />
            <PatientReports />
          </div>
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};
