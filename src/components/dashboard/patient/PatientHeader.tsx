
import { Button } from "@/components/ui/button";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { LogOut, CalendarPlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PatientHeader = () => {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();

  // Fetch profile data
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id
  });

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
      <h1 className="text-2xl sm:text-3xl font-bold truncate">
        Welcome {profile?.first_name}{profile?.last_name ? `, ${profile.last_name}` : ""}
      </h1>
      <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
        <ScheduleAppointment>
          <Button 
            className="flex-1 sm:flex-initial gap-2" 
            size={isMobile ? "lg" : "default"}
            variant="default"
          >
            <CalendarPlus className="h-4 w-4" />
            Schedule Appointment
          </Button>
        </ScheduleAppointment>
        <Button 
          variant="outline" 
          onClick={signOut}
          className="gap-2 flex-1 sm:flex-initial"
          size={isMobile ? "lg" : "default"}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
