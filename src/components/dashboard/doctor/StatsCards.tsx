
import { Card, CardContent } from "@/components/ui/card";
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

  // Render loading skeleton if data is still loading
  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col items-center">
            <div className="bg-[#E5DEFF] p-3 rounded-full mb-2">
              <Users className="h-6 w-6 text-[#9b87f5]" />
            </div>
            <span className="text-2xl font-bold">{isError ? "0" : doctorStats?.patients_count || 0}</span>
            <span className="text-xs text-gray-500 text-center">Patients</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-[#FDE1D3] p-3 rounded-full mb-2">
              <Calendar className="h-6 w-6 text-[#F97316]" />
            </div>
            <span className="text-2xl font-bold">{isError ? "0" : todayAppointments.length}</span>
            <span className="text-xs text-gray-500 text-center">Today</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-[#D3E4FD] p-3 rounded-full mb-2">
              <FileText className="h-6 w-6 text-[#0EA5E9]" />
            </div>
            <span className="text-2xl font-bold">{isError ? "0" : doctorStats?.medical_records_count || 0}</span>
            <span className="text-xs text-gray-500 text-center">Records</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-[#F2FCE2] p-3 rounded-full mb-2">
              <Clock className="h-6 w-6 text-green-500" />
            </div>
            <span className="text-2xl font-bold">{isError ? "0" : upcomingAppointments.length}</span>
            <span className="text-xs text-gray-500 text-center">Upcoming</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
