
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export const StatsCards = () => {
  const { user } = useAuth();

  const { data: patientsCount = 0 } = useQuery({
    queryKey: ["patients_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("patient_assignments")
        .select("*", { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: medicalRecordsCount = 0 } = useQuery({
    queryKey: ["medical_records_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("medical_records")
        .select("*", { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["doctor_appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("scheduled_at")
        .eq("status", 'scheduled');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate today's appointments
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppointments = appointments.filter(apt => 
    format(new Date(apt.scheduled_at), 'yyyy-MM-dd') === today
  );

  // Calculate upcoming appointments (future appointments)
  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.scheduled_at) > new Date()
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{patientsCount}</div>
          <p className="text-xs text-muted-foreground">Active patients under care</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todayAppointments.length}</div>
          <p className="text-xs text-muted-foreground">Scheduled for today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{medicalRecordsCount}</div>
          <p className="text-xs text-muted-foreground">Total records created</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Consultations</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
          <p className="text-xs text-muted-foreground">Pending appointments</p>
        </CardContent>
      </Card>
    </div>
  );
};
