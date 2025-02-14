
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
import { PatientReports } from "./patient/PatientReports";

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

      console.log("Profile data:", profile); // Debug log

      // Then get appointments and medical records
      const [
        { data: appointments, error: appointmentsError },
        { data: medicalRecords, error: medicalRecordsError }
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select(`
            id,
            scheduled_at,
            status,
            doctor:profiles!appointments_doctor_profile_fkey(first_name, last_name)
          `)
          .eq("patient_id", user.id)
          .order("scheduled_at", { ascending: true }),
        supabase
          .from("medical_records")
          .select("*")
          .eq("patient_id", user.id)
          .order("created_at", { ascending: false })
      ]);

      if (appointmentsError) throw appointmentsError;
      if (medicalRecordsError) throw medicalRecordsError;

      return {
        profile,
        appointments: appointments || [],
        medicalRecords: medicalRecords || []
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
            onSignOut={handleSignOut}
          />
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        <PatientStats 
          appointmentsCount={scheduledAppointments.length}
          medicalRecordsCount={patientData?.medicalRecords.length || 0}
          nextAppointmentDate={nextAppointmentDate}
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
