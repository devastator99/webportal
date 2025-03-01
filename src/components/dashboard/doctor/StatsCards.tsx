
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export const StatsCards = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  console.log("DoctorStatsCards render - Current user:", { 
    userId: user?.id, 
    userEmail: user?.email 
  });

  const { data: patientsCount = 0, isError: isPatientsError } = useQuery({
    queryKey: ["doctor_patients_count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      console.log("Fetching patients count for doctor:", user?.id);
      const { count, error } = await supabase
        .from("patient_assignments")
        .select("*", { count: 'exact', head: true })
        .eq('doctor_id', user?.id);

      if (error) {
        console.error("Error fetching patients count:", error);
        toast({
          title: "Error",
          description: "Could not fetch patients data",
          variant: "destructive"
        });
        throw error;
      }
      
      console.log("Patients count result:", { count });
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const { data: medicalRecordsCount = 0, isError: isMedicalRecordsError } = useQuery({
    queryKey: ["doctor_medical_records_count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      console.log("Fetching medical records count for doctor:", user?.id);
      const { count, error } = await supabase
        .from("medical_records")
        .select("*", { count: 'exact', head: true })
        .eq('doctor_id', user?.id);

      if (error) {
        console.error("Error fetching medical records count:", error);
        toast({
          title: "Error",
          description: "Could not fetch medical records data",
          variant: "destructive"
        });
        throw error;
      }
      
      console.log("Medical records count result:", { count });
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const { data: appointments = [], isError: isAppointmentsError } = useQuery({
    queryKey: ["doctor_appointments_stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log("Fetching appointments for doctor:", user?.id);
      const { data, error } = await supabase
        .from("appointments")
        .select("scheduled_at, status")
        .eq('doctor_id', user?.id);

      if (error) {
        console.error("Error fetching appointments:", error);
        toast({
          title: "Error",
          description: "Could not fetch appointments data",
          variant: "destructive"
        });
        throw error;
      }
      
      console.log("Appointments result:", { count: data?.length, data });
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calculate today's appointments
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppointments = appointments.filter(apt => 
    format(new Date(apt.scheduled_at), 'yyyy-MM-dd') === today && 
    apt.status === 'scheduled'
  );

  // Calculate upcoming appointments (future appointments)
  const now = new Date();
  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.scheduled_at) > now && 
    apt.status === 'scheduled'
  );

  console.log("Doctor Stats summary:", {
    patientsCount,
    medicalRecordsCount,
    todayAppointments: todayAppointments.length,
    upcomingAppointments: upcomingAppointments.length
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isPatientsError ? "Error" : patientsCount}</div>
          <p className="text-xs text-muted-foreground">Active patients under care</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isAppointmentsError ? "Error" : todayAppointments.length}</div>
          <p className="text-xs text-muted-foreground">Scheduled for today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isMedicalRecordsError ? "Error" : medicalRecordsCount}</div>
          <p className="text-xs text-muted-foreground">Total records created</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Consultations</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isAppointmentsError ? "Error" : upcomingAppointments.length}</div>
          <p className="text-xs text-muted-foreground">Pending appointments</p>
        </CardContent>
      </Card>
    </div>
  );
};
