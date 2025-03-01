
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isFuture } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const today = new Date();
  const formattedDate = format(today, "yyyy-MM-dd");

  const { data, isLoading } = useQuery<AppointmentWithPatient[]>({
    queryKey: ["today_appointments", user?.id, formattedDate],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        console.log("Fetching today's appointments for doctor:", user.id);
        
        // Use the Supabase function we created to fetch appointments with patients
        const { data: appointmentsData, error } = await supabase
          .rpc('get_doctor_appointments_with_patients', {
            doctor_id: user.id,
            date_filter: formattedDate
          });

        if (error) {
          console.error("Error fetching today's appointments:", error);
          throw error;
        }

        console.log("Appointments fetched:", appointmentsData);
        
        // Convert the data to the expected format
        const formattedAppointments: AppointmentWithPatient[] = appointmentsData?.map((appointment: any) => ({
          id: appointment.id,
          scheduled_at: appointment.scheduled_at,
          status: appointment.status,
          patient: {
            first_name: appointment.patient.first_name || "Unknown",
            last_name: appointment.patient.last_name || "Patient"
          }
        })) || [];

        return formattedAppointments;
      } catch (error) {
        console.error("Error in today's schedule fetch:", error);
        
        // Fallback to the two-step approach if the RPC fails
        try {
          // Step 1: Fetch appointments for today
          const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .select('id, scheduled_at, status, patient_id')
            .eq('doctor_id', user.id)
            .gte('scheduled_at', `${formattedDate}T00:00:00`)
            .lte('scheduled_at', `${formattedDate}T23:59:59`)
            .order('scheduled_at');

          if (appointmentsError) {
            console.error("Error in fallback appointments fetch:", appointmentsError);
            return [];
          }

          if (!appointmentsData || appointmentsData.length === 0) {
            return [];
          }

          // Step 2: Then fetch patient details for each appointment
          const appointmentsWithPatients = await Promise.all(
            appointmentsData.map(async (appointment) => {
              try {
                const { data: patientData, error: patientError } = await supabase
                  .from('profiles')
                  .select('first_name, last_name')
                  .eq('id', appointment.patient_id)
                  .single();

                if (patientError) {
                  console.error(`Error fetching patient for appointment ${appointment.id}:`, patientError);
                  // Return appointment with default patient info if patient fetch fails
                  return {
                    id: appointment.id,
                    scheduled_at: appointment.scheduled_at,
                    status: appointment.status,
                    patient: { first_name: "Unknown", last_name: "Patient" }
                  };
                }

                return {
                  id: appointment.id,
                  scheduled_at: appointment.scheduled_at,
                  status: appointment.status,
                  patient: {
                    first_name: patientData.first_name || "Unknown",
                    last_name: patientData.last_name || "Patient"
                  }
                };
              } catch (err) {
                console.error(`Error processing patient data for appointment ${appointment.id}:`, err);
                return {
                  id: appointment.id,
                  scheduled_at: appointment.scheduled_at,
                  status: appointment.status,
                  patient: { first_name: "Unknown", last_name: "Patient" }
                };
              }
            })
          );

          return appointmentsWithPatients;
        } catch (fallbackError) {
          console.error("Error in fallback approach:", fallbackError);
          return [];
        }
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter for upcoming appointments today (exclude past appointments)
  const upcomingAppointments = data && Array.isArray(data) 
    ? data.filter(appointment => isFuture(new Date(appointment.scheduled_at)))
    : [];

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-3">
        <CardTitle>Today's Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full pr-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading today's appointments...</p>
          ) : upcomingAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No more appointments scheduled for today</p>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">
                      {appointment.patient?.first_name || "Unknown"} {appointment.patient?.last_name || "Patient"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(appointment.scheduled_at), "h:mm a")}
                    </p>
                  </div>
                  <Badge variant="outline">{appointment.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
