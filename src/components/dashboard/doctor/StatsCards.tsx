
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Define TypeScript interface for the combined stats return
interface DoctorStats {
  patients_count: number;
  medical_records_count: number;
  appointments: {
    id: string;
    scheduled_at: string;
    status: "scheduled" | "completed" | "cancelled";
  }[];
}

export const StatsCards = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: doctorStats, isError } = useQuery({
    queryKey: ["doctor_dashboard_stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { patients_count: 0, medical_records_count: 0, appointments: [] } as DoctorStats;
      
      try {
        // Use a single RPC call to fetch all stats in one go
        const { data, error } = await supabase.rpc(
          'get_doctor_dashboard_stats', 
          { doctor_id: user.id }
        );

        if (error) {
          throw error;
        }
        
        return data as DoctorStats || { 
          patients_count: 0, 
          medical_records_count: 0, 
          appointments: [] 
        };
      } catch (error) {
        console.error("Error fetching doctor stats:", error);
        // Don't show toast here to avoid UI clutter
        return { 
          patients_count: 0, 
          medical_records_count: 0, 
          appointments: [] 
        } as DoctorStats;
      }
    },
    enabled: !!user?.id,
  });

  // Calculate today's appointments
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppointments = doctorStats?.appointments 
    ? doctorStats.appointments.filter(apt => 
        format(new Date(apt.scheduled_at), 'yyyy-MM-dd') === today && 
        apt.status === 'scheduled'
      )
    : [];

  // Calculate upcoming appointments (future appointments)
  const now = new Date();
  const upcomingAppointments = doctorStats?.appointments
    ? doctorStats.appointments.filter(apt => 
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
          <div className="text-2xl font-bold">{isError ? "0" : doctorStats?.patients_count || 0}</div>
          <p className="text-xs text-muted-foreground">Active patients under care</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isError ? "0" : todayAppointments.length}</div>
          <p className="text-xs text-muted-foreground">Scheduled for today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isError ? "0" : doctorStats?.medical_records_count || 0}</div>
          <p className="text-xs text-muted-foreground">Total records created</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Consultations</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isError ? "0" : upcomingAppointments.length}</div>
          <p className="text-xs text-muted-foreground">Pending appointments</p>
        </CardContent>
      </Card>
    </div>
  );
};
