
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChatInterface } from "../chat/ChatInterface";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { PatientHeader } from "./patient/PatientHeader";
import { PatientStats } from "./patient/PatientStats";
import { AppointmentsList } from "./patient/AppointmentsList";
import { MedicalRecordsList } from "./patient/MedicalRecordsList";
import { PatientFlow } from "./patient/PatientFlow";

export const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      navigate("/");
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Error signing out",
        description: error.message || "An error occurred while signing out. Please try again.",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const { data: patientData, isLoading } = useQuery({
    queryKey: ["patient_dashboard", user?.id],
    queryFn: async () => {
      const [
        { data: appointments, error: appointmentsError },
        { data: medicalRecords, error: medicalRecordsError },
        { data: profile, error: profileError }
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select(`
            id,
            scheduled_at,
            status,
            doctor:profiles!appointments_doctor_profile_fkey(first_name, last_name)
          `)
          .eq("patient_id", user?.id)
          .order("scheduled_at", { ascending: true }),
        supabase
          .from("medical_records")
          .select("*")
          .eq("patient_id", user?.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user?.id)
          .maybeSingle()
      ]);

      if (appointmentsError) throw appointmentsError;
      if (medicalRecordsError) throw medicalRecordsError;
      if (profileError) throw profileError;

      return {
        appointments: appointments || [],
        medicalRecords: medicalRecords || [],
        profile
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="sticky top-0 bg-background z-10 pb-4">
        <PatientHeader 
          firstName={patientData?.profile?.first_name}
          lastName={patientData?.profile?.last_name}
          onSignOut={handleSignOut}
        />
      </div>
      
      <PatientStats 
        appointmentsCount={scheduledAppointments.length}
        medicalRecordsCount={patientData?.medicalRecords.length || 0}
        nextAppointmentDate={nextAppointmentDate}
      />

      <PatientFlow />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <AppointmentsList appointments={scheduledAppointments} />
          <MedicalRecordsList records={patientData?.medicalRecords || []} />
        </div>
        <ChatInterface />
      </div>
    </div>
  );
};
