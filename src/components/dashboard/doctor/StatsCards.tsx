
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, FileText, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface DoctorStats {
  patients_count: number;
  medical_records_count: number;
  todays_appointments: number;
  upcoming_appointments: number;
}

export const StatsCards = () => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState<DoctorStats | null>(null);

  // Query to fetch initial stats
  const { isLoading, isError, refetch } = useQuery({
    queryKey: ["doctor_dashboard_stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        console.log("Fetching dashboard stats for doctor:", user.id);
        
        // Use the new function to get all stats in one query
        const { data, error } = await supabase.rpc('get_doctor_all_stats', { 
          doctor_id: user.id 
        });
        
        if (error) {
          throw new Error('Failed to fetch doctor stats: ' + error.message);
        }
        
        console.log("Dashboard stats fetched:", data);
        
        // Update local state with the fetched data
        setStatsData({
          patients_count: Number(data.patients_count) || 0,
          medical_records_count: Number(data.medical_records_count) || 0,
          todays_appointments: Number(data.todays_appointments) || 0,
          upcoming_appointments: Number(data.upcoming_appointments) || 0
        });
        
        return data;
      } catch (error) {
        console.error("Error fetching doctor stats:", error);
        toast({
          title: "Error loading statistics",
          description: "Failed to load one or more statistics. Please try again later.",
          variant: "destructive",
        });
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 60000, // Cache for 1 minute
    retry: 1,
  });

  // Set up realtime subscriptions to update stats when data changes
  useEffect(() => {
    if (!user?.id) return;

    // Create a realtime channel to listen for changes
    const channel = supabase
      .channel('doctor-stats-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'patient_assignments',
          filter: `doctor_id=eq.${user.id}`
        },
        () => refetch()
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'medical_records',
          filter: `doctor_id=eq.${user.id}`
        },
        () => refetch()
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments',
          filter: `doctor_id=eq.${user.id}`
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  // Manual refresh every 2 minutes as a fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id) refetch();
    }, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [user?.id, refetch]);

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
            <span className="text-2xl font-bold">{isError ? "0" : statsData?.patients_count || 0}</span>
            <span className="text-xs text-gray-500 text-center">Patients</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-[#FDE1D3] p-3 rounded-full mb-2">
              <Calendar className="h-6 w-6 text-[#F97316]" />
            </div>
            <span className="text-2xl font-bold">{isError ? "0" : statsData?.todays_appointments || 0}</span>
            <span className="text-xs text-gray-500 text-center">Today</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-[#D3E4FD] p-3 rounded-full mb-2">
              <FileText className="h-6 w-6 text-[#0EA5E9]" />
            </div>
            <span className="text-2xl font-bold">{isError ? "0" : statsData?.medical_records_count || 0}</span>
            <span className="text-xs text-gray-500 text-center">Records</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-[#F2FCE2] p-3 rounded-full mb-2">
              <Clock className="h-6 w-6 text-green-500" />
            </div>
            <span className="text-2xl font-bold">{isError ? "0" : statsData?.upcoming_appointments || 0}</span>
            <span className="text-xs text-gray-500 text-center">Upcoming</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
