
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

// Define the correct type for the appointment data returned from our RPC function
interface AppointmentWithPatient {
  id: string;
  scheduled_at: string;
  status: string;
  patient: {
    first_name: string;
    last_name: string;
  };
}

export const TodaySchedule = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: appointments = [], isLoading, error } = useQuery<AppointmentWithPatient[], Error>({
    queryKey: ["today_appointments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as AppointmentWithPatient[];

      // Get today's date in the format YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      console.log("Fetching today's appointments for date:", today, "doctor:", user.id);
      
      try {
        // Use the security definer RPC function to safely fetch appointments with patient data
        const { data, error: rpcError } = await supabase.rpc<AppointmentWithPatient[]>(
          'get_doctor_appointments_with_patients',
          { doctor_id: user.id, date_filter: today }
        );

        if (rpcError) {
          console.error("Error fetching appointments:", rpcError);
          throw rpcError;
        }

        console.log("Appointments with patients data:", data);
        
        // Explicitly cast to the correct type and handle null case
        return (data || []) as AppointmentWithPatient[];
      } catch (error) {
        console.error("Error in appointment fetch:", error);
        toast({
          title: "Error loading appointments",
          description: "There was a problem loading your appointments.",
          variant: "destructive",
        });
        return [] as AppointmentWithPatient[];
      }
    },
    enabled: !!user?.id,
  });

  if (error) {
    console.error("Query error in TodaySchedule:", error);
  }

  // Ensure appointments is always treated as an array
  const appointmentsArray = Array.isArray(appointments) ? appointments : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading schedule...</p>
          ) : appointmentsArray.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments scheduled for today</p>
          ) : (
            appointmentsArray.map((appointment) => (
              <div key={appointment.id} className="flex justify-between items-center p-3 bg-background rounded-lg border">
                <div>
                  <p className="font-medium">
                    {appointment.patient.first_name} {appointment.patient.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(appointment.scheduled_at), "h:mm a")}
                  </p>
                </div>
                <Badge variant={appointment.status === "scheduled" ? "default" : "secondary"}>
                  {appointment.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
