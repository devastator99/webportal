
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
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
  
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["today_appointments", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");

      // Get today's date in the format YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      console.log("Fetching today's appointments for date:", today, "doctor:", user.id);
      
      try {
        // First, get all appointments for today
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointments")
          .select(`
            id,
            scheduled_at,
            status,
            patient_id
          `)
          .eq("doctor_id", user.id)
          .gte("scheduled_at", `${today}T00:00:00`)
          .lt("scheduled_at", `${today}T23:59:59`)
          .order("scheduled_at");

        if (appointmentsError) {
          console.error("Error fetching appointments:", appointmentsError);
          throw appointmentsError;
        }

        console.log("Raw appointments data:", appointmentsData);

        if (!appointmentsData || appointmentsData.length === 0) {
          return [];
        }

        // Then, get patient profiles for these appointments
        const { data: patientProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", appointmentsData.map(apt => apt.patient_id));

        if (profilesError) {
          console.error("Error fetching patient profiles:", profilesError);
          throw profilesError;
        }

        console.log("Patient profiles:", patientProfiles);

        // Combine the data
        const appointmentsWithPatients = appointmentsData.map(appointment => {
          const patientProfile = patientProfiles.find(profile => profile.id === appointment.patient_id);
          return {
            id: appointment.id,
            scheduled_at: appointment.scheduled_at,
            status: appointment.status,
            patient: {
              first_name: patientProfile?.first_name || "Unknown",
              last_name: patientProfile?.last_name || "Patient"
            }
          };
        });

        console.log("Final appointments data:", appointmentsWithPatients);
        return appointmentsWithPatients;

      } catch (error) {
        console.error("Error in appointment fetch:", error);
        toast({
          title: "Error loading appointments",
          description: "There was a problem loading your appointments.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user?.id,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading schedule...</p>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments scheduled for today</p>
          ) : (
            appointments.map((appointment) => (
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
