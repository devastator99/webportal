
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Define TypeScript interface for the stats data
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

  const { data: doctorStats, isLoading, isError } = useQuery({
    queryKey: ["doctor_dashboard_stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { patients_count: 0, medical_records_count: 0, appointments: [] } as DoctorStats;
      
      try {
        // Use the existing RPC functions to fetch counts
        const { data: patientsCount, error: patientsError } = await supabase.rpc(
          'get_doctor_patients_count', 
          { doctor_id: user.id }
        );

        if (patientsError) {
          console.error("Error fetching patients count:", patientsError);
        }

        const { data: recordsCount, error: recordsError } = await supabase.rpc(
          'get_doctor_medical_records_count',
          { doctor_id: user.id }
        );

        if (recordsError) {
          console.error("Error fetching medical records count:", recordsError);
        }

        // Fetch appointments 
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('id, scheduled_at, status')
          .eq('doctor_id', user.id);

        if (appointmentsError) {
          console.error("Error fetching appointments:", appointmentsError);
        }
        
        return {
          patients_count: patientsCount || 0,
          medical_records_count: recordsCount || 0,
          appointments: appointments || []
        } as DoctorStats;
      } catch (error) {
        console.error("Error fetching doctor stats:", error);
        return { 
          patients_count: 0, 
          medical_records_count: 0, 
          appointments: [] 
        } as DoctorStats;
      }
    },
    enabled: !!user?.id,
    staleTime: 60000, // Cache for 1 minute to reduce frequent refetches
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

  // Render loading skeletons if data is still loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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
