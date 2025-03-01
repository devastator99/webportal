
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define the correct type for the appointment data
interface AppointmentWithPatient {
  id: string;
  scheduled_at: string;
  status: string;
  patient: {
    first_name: string;
    last_name: string;
  };
}

export const DoctorAppointmentCalendar = ({ doctorId }: { doctorId: string }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();

  const { data: appointments = [], isLoading, error } = useQuery<AppointmentWithPatient[], Error>({
    queryKey: ["doctor_appointments", doctorId, format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!doctorId) return [];
      
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      console.log("Fetching appointments for date:", formattedDate, "doctor:", doctorId);
      
      try {
        // Simplify the query to avoid RLS recursion issues
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('id, scheduled_at, status, patient_id')
          .eq('doctor_id', doctorId)
          .gte('scheduled_at', `${formattedDate}T00:00:00`)
          .lte('scheduled_at', `${formattedDate}T23:59:59`);

        if (appointmentsError) {
          console.error("Error fetching appointments:", appointmentsError);
          throw appointmentsError;
        }

        if (!appointmentsData || appointmentsData.length === 0) {
          return [];
        }

        // Separately fetch patient details to avoid join issues
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
      } catch (error) {
        console.error("Error in calendar appointment fetch:", error);
        toast({
          title: "Error loading appointments",
          description: "There was a problem loading your appointments.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!doctorId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (error) {
    console.error("Query error in DoctorAppointmentCalendar:", error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments Calendar</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
          />
        </div>
        <div className="space-y-4">
          <h3 className="font-medium">
            Appointments for {format(selectedDate, "MMMM d, yyyy")}
          </h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading appointments...</p>
          ) : error ? (
            <div className="p-3 border border-red-300 bg-red-50 text-red-700 rounded-lg">
              <p className="font-medium">Error loading appointments</p>
              <p className="text-sm">There was a problem loading your appointments.</p>
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments scheduled for this day</p>
          ) : (
            appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex justify-between items-center p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {appointment.patient?.first_name || "Unknown"} {appointment.patient?.last_name || "Patient"}
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
