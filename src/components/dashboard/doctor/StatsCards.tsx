
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, FileText, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface DoctorStats {
  patients_count: number;
  medical_records_count: number;
  todays_appointments: number;
  upcoming_appointments: number;
}

export const StatsCards = () => {
  const { user } = useAuth();

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
        console.log("Fetching dashboard stats for doctor:", user.id);
        
        // Get patients count
        const { data: patientsCount, error: patientsError } = await supabase.rpc(
          'get_doctor_patients_count',
          { doctor_id: user.id }
        );
        
        if (patientsError) {
          console.error("Error fetching patients count:", patientsError);
          toast({
            title: "Error fetching patient count",
            description: patientsError.message,
            variant: "destructive",
          });
        }

        // Get medical records count
        const { data: recordsCount, error: recordsError } = await supabase.rpc(
          'get_doctor_medical_records_count',
          { doctor_id: user.id }
        );

        if (recordsError) {
          console.error("Error fetching medical records count:", recordsError);
          toast({
            title: "Error fetching records count",
            description: recordsError.message,
            variant: "destructive",
          });
        }

        // Use direct fetch for today's appointments count
        const todaysAppointmentsResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_doctor_todays_appointments_count`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({ doctor_id: user.id })
          }
        );
        
        let todaysCount = 0;
        if (todaysAppointmentsResponse.ok) {
          todaysCount = Number(await todaysAppointmentsResponse.json()) || 0;
        } else {
          console.error("Error fetching today's appointments count:", await todaysAppointmentsResponse.text());
        }

        // Use direct fetch for upcoming appointments count
        const upcomingAppointmentsResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_doctor_upcoming_appointments_count`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({ doctor_id: user.id })
          }
        );
        
        let upcomingCount = 0;
        if (upcomingAppointmentsResponse.ok) {
          upcomingCount = Number(await upcomingAppointmentsResponse.json()) || 0;
        } else {
          console.error("Error fetching upcoming appointments count:", await upcomingAppointmentsResponse.text());
        }
        
        console.log("Dashboard stats fetched:", {
          patients: patientsCount,
          records: recordsCount,
          today: todaysCount,
          upcoming: upcomingCount
        });
        
        return {
          patients_count: Number(patientsCount) || 0,
          medical_records_count: Number(recordsCount) || 0,
          todays_appointments: todaysCount,
          upcoming_appointments: upcomingCount
        } as DoctorStats;
      } catch (error) {
        console.error("Error fetching doctor stats:", error);
        toast({
          title: "Error loading statistics",
          description: "Failed to load one or more statistics. Please try again later.",
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
    staleTime: 300000, // Cache for 5 minutes
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="h-12 w-12 rounded-full mb-2" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-20 mt-1" />
              </div>
            ))}
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
