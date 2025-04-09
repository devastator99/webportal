
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  total_users: number;
  total_clinics: number;
  system_status: string;
}

export const useAdminStats = () => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ["admin_dashboard_stats"],
    queryFn: async () => {
      try {
        // Get total users count using the RPC function
        const { data: usersData, error: usersError } = await supabase
          .rpc('get_admin_users_count');
        
        if (usersError) throw usersError;
        
        // Get total clinics count using the RPC function
        const { data: clinicsData, error: clinicsError } = await supabase
          .rpc('get_admin_clinics_count');
          
        if (clinicsError) throw clinicsError;
        
        // Get system status using the RPC function
        const { data: statusData, error: statusError } = await supabase
          .rpc('get_system_status');
        
        if (statusError) throw statusError;
        
        return {
          total_users: usersData || 0,
          total_clinics: clinicsData || 0,
          system_status: statusData || "Unknown"
        } as AdminStats;
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        toast({
          title: "Error loading dashboard data",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive"
        });
        
        return {
          total_users: 0,
          total_clinics: 0,
          system_status: "Unknown"
        } as AdminStats;
      }
    },
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false
  });
};
