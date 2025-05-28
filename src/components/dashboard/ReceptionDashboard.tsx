
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MessageCircle, Users } from "lucide-react";
import { AppointmentsList } from "./patient/AppointmentsList";
import { DashboardHeader } from "./DashboardHeader";
import { featureFlags } from "@/config/features";
import { ChatModule } from "@/modules/chat/ChatModule";

export const ReceptionDashboard = () => {
  const { user } = useAuth();

  const { data: dashboardData } = useQuery({
    queryKey: ["reception_dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");

      const [
        { data: appointments, error: appointmentsError },
        { data: patientsCount, error: patientsError },
        { data: doctorsCount, error: doctorsError }
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select(`
            id,
            scheduled_at,
            status,
            doctor:profiles!appointments_doctor_profile_fkey(
              first_name,
              last_name
            ),
            patient:profiles!appointments_patient_profile_fkey(
              first_name,
              last_name
            )
          `)
          .eq("status", "scheduled")
          .order("scheduled_at", { ascending: true }),
        supabase
          .from("user_roles")
          .select("*", { count: 'exact' })
          .eq("role", "patient"),
        supabase
          .from("user_roles")
          .select("*", { count: 'exact' })
          .eq("role", "doctor")
      ]);

      if (appointmentsError) throw appointmentsError;
      if (patientsError) throw patientsError;
      if (doctorsError) throw doctorsError;

      // Transform appointments to fix type issues
      const transformedAppointments = (appointments || []).map(appointment => ({
        id: appointment.id,
        scheduled_at: appointment.scheduled_at,
        status: appointment.status,
        doctor: Array.isArray(appointment.doctor) ? appointment.doctor[0] : appointment.doctor,
        patient: Array.isArray(appointment.patient) ? appointment.patient[0] : appointment.patient
      }));

      return {
        appointments: transformedAppointments,
        totalPatients: patientsCount?.length || 0,
        totalDoctors: doctorsCount?.length || 0
      };
    },
    enabled: !!user?.id
  });

  return (
    <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
      <DashboardHeader />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.appointments.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalPatients || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalDoctors || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentsList appointments={dashboardData?.appointments || []} />
        
        {/* Only show chat if enabled */}
        {featureFlags.enableChat && featureFlags.receptionDashboardChat && (
          <ChatModule showChatbotWidget={false} />
        )}
      </div>
    </div>
  );
};
