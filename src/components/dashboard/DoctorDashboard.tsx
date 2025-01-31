import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { StatsCards } from "./doctor/StatsCards";
import { TodaySchedule } from "./doctor/TodaySchedule";
import { RecentPatients } from "./doctor/RecentPatients";
import { ChatInterface } from "../chat/ChatInterface";

export const DoctorDashboard = () => {
  const { user } = useAuth();

  const { data: patients } = useQuery({
    queryKey: ["patients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_assignments")
        .select(`
          id,
          patient_id,
          created_at,
          patient:profiles!patient_assignments_patient_profile_fkey(first_name, last_name)
        `)
        .eq("doctor_id", user?.id);

      if (error) throw error;
      return data;
    },
  });

  const { data: appointments } = useQuery({
    queryKey: ["doctor_appointments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_at,
          status,
          patient:profiles!appointments_patient_profile_fkey(first_name, last_name)
        `)
        .eq("doctor_id", user?.id)
        .eq("status", "scheduled")
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: medicalRecords } = useQuery({
    queryKey: ["medical_records", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_records")
        .select("*")
        .eq("doctor_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getTodayAppointments = () => {
    if (!appointments) return [];
    const today = new Date();
    return appointments.filter(
      (apt) => format(new Date(apt.scheduled_at), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-saas-purple">Doctor Dashboard</h1>
      
      <StatsCards
        patientsCount={patients?.length || 0}
        todayAppointmentsCount={getTodayAppointments().length}
        medicalRecordsCount={medicalRecords?.length || 0}
        upcomingAppointmentsCount={appointments?.length || 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <TodaySchedule appointments={getTodayAppointments()} />
          <RecentPatients patients={patients || []} />
        </div>
        <ChatInterface />
      </div>
    </div>
  );
};