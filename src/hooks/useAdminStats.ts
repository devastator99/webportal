
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
        // Get total users count
        const { count: usersCount, error: usersError } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true });
        
        if (usersError) throw usersError;
        
        // Get total clinics (using distinct clinic locations)
        const { data: clinicsData, error: clinicsError } = await supabase
          .from('profiles')
          .select('clinic_location')
          .not('clinic_location', 'is', null)
          .not('clinic_location', 'eq', '');
          
        if (clinicsError) throw clinicsError;
        
        // Get unique clinic locations count
        const uniqueClinicLocations = new Set(
          clinicsData.map(profile => profile.clinic_location)
        );
        
        // Check system status - if we got here, system is operational
        const systemStatus = "Operational";
        
        return {
          total_users: usersCount || 0,
          total_clinics: uniqueClinicLocations.size || 0,
          system_status: systemStatus
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
