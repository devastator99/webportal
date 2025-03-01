
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
  
  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ["today_appointments", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");

      // Get today's date in the format YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      console.log("Fetching today's appointments for date:", today, "doctor:", user.id);
      
      try {
        // Use the get_doctor_appointments RPC function which works properly
        const { data: appointmentsData, error: appointmentsError } = await supabase.rpc(
          'get_doctor_appointments',
          { doctor_id: user.id }
        );

        if (appointmentsError) {
          console.error("Error fetching appointments:", appointmentsError);
          throw appointmentsError;
        }

        console.log("Raw appointments data:", appointmentsData);

        if (!appointmentsData || appointmentsData.length === 0) {
          return [];
        }

        // Filter for today's appointments only
        const todayStart = new Date(today);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const todayAppointments = appointmentsData.filter(apt => {
          const aptDate = new Date(apt.scheduled_at);
          return aptDate >= todayStart && aptDate <= todayEnd;
        });

        // Get patient profiles in a separate query
        const appointmentIds = todayAppointments.map(apt => apt.id);
        
        if (appointmentIds.length === 0) {
          return [];
        }
        
        // Get the full appointment data including patient info
        const { data: fullAppointments, error: fullAptsError } = await supabase
          .from("appointments")
          .select("id, scheduled_at, status, patient_id")
          .in("id", appointmentIds);
          
        if (fullAptsError) {
          console.error("Error fetching full appointments:", fullAptsError);
          throw fullAptsError;
        }
        
        if (!fullAppointments || fullAppointments.length === 0) {
          return [];
        }
        
        // Get patient profiles
        const patientIds = fullAppointments.map(apt => apt.patient_id);
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", patientIds);

        if (profilesError) {
          console.error("Error fetching patient profiles:", profilesError);
          throw profilesError;
        }

        // Create a map of patient profiles for faster lookup
        const profileMap = new Map(
          profiles?.map(profile => [profile.id, profile]) || []
        );

        // Combine appointments with patient data
        const appointmentsWithPatients = fullAppointments.map(appointment => ({
          id: appointment.id,
          scheduled_at: appointment.scheduled_at,
          status: appointment.status,
          patient: {
            first_name: profileMap.get(appointment.patient_id)?.first_name || "Unknown",
            last_name: profileMap.get(appointment.patient_id)?.last_name || "Patient"
          }
        }));

        console.log("Processed appointments with patients:", appointmentsWithPatients);
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

  if (error) {
    console.error("Query error in TodaySchedule:", error);
  }

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
