
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Define TypeScript types for the RPC function returns
type DoctorAppointment = {
  id: string;
  scheduled_at: string;
  status: "scheduled" | "completed" | "cancelled";
};

export const StatsCards = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: patientsCount = 0, isError: isPatientsError } = useQuery({
    queryKey: ["doctor_patients_count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      try {
        // Use RPC call to a stored procedure on the server side
        const { data, error } = await supabase.rpc(
          'get_doctor_patients_count', 
          { doctor_id: user.id }
        );

        if (error) {
          throw error;
        }
        
        return data as number || 0;
      } catch (error) {
        // Don't show toast here, just return 0
        return 0;
      }
    },
    enabled: !!user?.id,
  });

  const { data: medicalRecordsCount = 0, isError: isMedicalRecordsError } = useQuery({
    queryKey: ["doctor_medical_records_count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      try {
        // Use RPC call to a stored procedure on the server side
        const { data, error } = await supabase.rpc(
          'get_doctor_medical_records_count', 
          { doctor_id: user.id }
        );

        if (error) {
          throw error;
        }
        
        return data as number || 0;
      } catch (error) {
        // Don't show toast here, just return 0
        return 0;
      }
    },
    enabled: !!user?.id,
  });

  const { data: appointments = [], isError: isAppointmentsError } = useQuery({
    queryKey: ["doctor_appointments_stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as DoctorAppointment[];
      
      try {
        // Use RPC call to a stored procedure on the server side
        const { data, error } = await supabase.rpc(
          'get_doctor_appointments', 
          { doctor_id: user.id }
        );

        if (error) {
          throw error;
        }
        
        const typedData = data as DoctorAppointment[];
        return typedData || [];
      } catch (error) {
        // Don't show toast here, just return an empty array
        return [] as DoctorAppointment[];
      }
    },
    enabled: !!user?.id,
  });

  // Calculate today's appointments
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppointments = Array.isArray(appointments) 
    ? appointments.filter(apt => 
        format(new Date(apt.scheduled_at), 'yyyy-MM-dd') === today && 
        apt.status === 'scheduled'
      )
    : [];

  // Calculate upcoming appointments (future appointments)
  const now = new Date();
  const upcomingAppointments = Array.isArray(appointments)
    ? appointments.filter(apt => 
        new Date(apt.scheduled_at) > now && 
        apt.status === 'scheduled'
      )
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isPatientsError ? "0" : patientsCount}</div>
          <p className="text-xs text-muted-foreground">Active patients under care</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isAppointmentsError ? "0" : todayAppointments.length}</div>
          <p className="text-xs text-muted-foreground">Scheduled for today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isMedicalRecordsError ? "0" : medicalRecordsCount}</div>
          <p className="text-xs text-muted-foreground">Total records created</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Consultations</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isAppointmentsError ? "0" : upcomingAppointments.length}</div>
          <p className="text-xs text-muted-foreground">Pending appointments</p>
        </CardContent>
      </Card>
    </div>
  );
};
