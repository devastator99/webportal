
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface NutritionistStats {
  patients_count: number;
  health_plans_count: number;
  calendar_events_count: number;
}

export const useNutritionistStats = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ["nutritionist_dashboard_stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return {
        patients_count: 0,
        health_plans_count: 0,
        calendar_events_count: 0
      } as NutritionistStats;
      
      try {
        // Get patient count assigned to this nutritionist
        const { data: patientsData, error: patientsError } = await supabase
          .from('patient_assignments')
          .select('id')
          .eq('nutritionist_id', user.id);

        if (patientsError) throw patientsError;
        
        // Get health plans count created by this nutritionist
        const { count: plansCount, error: plansError } = await supabase
          .from('health_plan_items')
          .select('*', { count: 'exact', head: true })
          .eq('nutritionist_id', user.id);
          
        if (plansError) throw plansError;
        
        // Get calendar events (substitute with appointments or other relevant metric)
        const { count: eventsCount, error: eventsError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', user.id); // Using doctor_id since nutritionist appointments might not exist
          
        if (eventsError) {
          console.warn("Error fetching nutritionist appointments:", eventsError);
        }
        
        return {
          patients_count: patientsData?.length || 0,
          health_plans_count: plansCount || 0,
          calendar_events_count: eventsCount || 0
        } as NutritionistStats;
      } catch (error) {
        console.error("Error fetching nutritionist stats:", error);
        toast({
          title: "Error loading dashboard data",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive"
        });
        
        return {
          patients_count: 0, 
          health_plans_count: 0,
          calendar_events_count: 0
        } as NutritionistStats;
      }
    },
    enabled: !!user?.id,
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false
  });
};
