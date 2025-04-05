
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
  todays_appointments: number;
  upcoming_appointments: number;
}

export const StatsCards = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: doctorStats, isLoading, isError } = useQuery({
    queryKey: ["doctor_dashboard_stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { 
        patients_count: 0, 
        medical_records_count: 0, 
        todays_appointments: 0, 
        upcoming_appointments: 0 
      } as DoctorStats;
      
      try {
        // Get patients count from patient_assignments table
        const { data: patientsCount, error: patientsError } = await supabase.rpc(
          'get_doctor_patients_count', 
          { doctor_id: user.id }
        );

        if (patientsError) {
          console.error("Error fetching patients count:", patientsError);
          throw patientsError;
        }

        // Get medical records count
        const { data: recordsCount, error: recordsError } = await supabase.rpc(
          'get_doctor_medical_records_count',
          { doctor_id: user.id }
        );

        if (recordsError) {
          console.error("Error fetching medical records count:", recordsError);
          throw recordsError;
        }

        // Get today's date in YYYY-MM-DD format for appointments
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Fetch today's appointments
        const { data: todayAppointments, error: todayApptsError } = await supabase.rpc(
          'get_appointments_by_date',
          { 
            p_doctor_id: user.id,
            p_date: today
          }
        );

        if (todayApptsError) {
          console.error("Error fetching today's appointments:", todayApptsError);
          throw todayApptsError;
        }

        // Calculate upcoming appointments (excluding today)
        const { data: allAppointments, error: allApptsError } = await supabase
          .from('appointments')
          .select('id, scheduled_at, status')
          .eq('doctor_id', user.id)
          .eq('status', 'scheduled')
          .gte('scheduled_at', new Date().toISOString());
          
        if (allApptsError) {
          console.error("Error fetching upcoming appointments:", allApptsError);
          throw allApptsError;
        }
        
        // Filter out today's appointments to get future appointments
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const upcomingAppointments = allAppointments.filter(appt => 
          new Date(appt.scheduled_at) >= tomorrow
        );
        
        return {
          patients_count: patientsCount || 0,
          medical_records_count: recordsCount || 0,
          todays_appointments: todayAppointments?.length || 0,
          upcoming_appointments: upcomingAppointments.length || 0
        } as DoctorStats;
      } catch (error) {
        console.error("Error fetching doctor stats:", error);
        toast({
          title: "Error loading dashboard stats",
          description: "There was a problem fetching your dashboard statistics.",
          variant: "destructive",
        });
        
        return { 
          patients_count: 0, 
          medical_records_count: 0, 
          todays_appointments: 0, 
          upcoming_appointments: 0 
        } as DoctorStats;
      }
    },
    enabled: !!user?.id,
    staleTime: 60000, // Cache for 1 minute
    retry: 2,
  });

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
            <span className="text-2xl font-bold">{isError ? "0" : doctorStats?.todays_appointments || 0}</span>
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
            <span className="text-2xl font-bold">{isError ? "0" : doctorStats?.upcoming_appointments || 0}</span>
            <span className="text-xs text-gray-500 text-center">Upcoming</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
