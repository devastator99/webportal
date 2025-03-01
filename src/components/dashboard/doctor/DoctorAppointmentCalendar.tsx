
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export const DoctorAppointmentCalendar = ({ doctorId }: { doctorId: string }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();

  const { data: appointments = [], isLoading, error } = useQuery<AppointmentWithPatient[], Error>({
    queryKey: ["doctor_appointments", doctorId, format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!doctorId) return [] as AppointmentWithPatient[];
      
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      console.log("Fetching appointments for date:", formattedDate, "doctor:", doctorId);
      
      try {
        // Use direct SQL query instead of RPC to avoid ambiguous column error
        const { data, error: queryError } = await supabase
          .from('appointments')
          .select(`
            id,
            scheduled_at,
            status,
            patient:patient_id(first_name, last_name)
          `)
          .eq('doctor_id', doctorId)
          .gte('scheduled_at', `${formattedDate}T00:00:00`)
          .lte('scheduled_at', `${formattedDate}T23:59:59`)
          .order('scheduled_at');

        if (queryError) {
          console.error("Error fetching appointments:", queryError);
          throw queryError;
        }

        // Transform the data to match the expected format
        const formattedData = data?.map(item => ({
          id: item.id,
          scheduled_at: item.scheduled_at,
          status: item.status,
          patient: item.patient || { first_name: "Unknown", last_name: "Patient" }
        })) || [];

        console.log("Appointments with patients data:", formattedData);
        return formattedData as AppointmentWithPatient[];
      } catch (error) {
        console.error("Error in calendar appointment fetch:", error);
        toast({
          title: "Error loading appointments",
          description: "There was a problem loading your appointments.",
          variant: "destructive",
        });
        return [] as AppointmentWithPatient[];
      }
    },
    enabled: !!doctorId,
  });

  if (error) {
    console.error("Query error in DoctorAppointmentCalendar:", error);
  }

  // Ensure appointments is always treated as an array
  const appointmentsArray = Array.isArray(appointments) ? appointments : [];

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
          ) : appointmentsArray.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments scheduled for this day</p>
          ) : (
            appointmentsArray.map((appointment) => (
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
