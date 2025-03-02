
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

// Define the interface for the appointment data returned by the RPC function
interface AppointmentWithPatient {
  id: string;
  scheduled_at: string;
  status: Database["public"]["Enums"]["appointment_status"];
  patient_json: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export const DoctorAppointmentCalendar = ({ doctorId }: { doctorId: string }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();

  const { data: appointments = [], isLoading, error } = useQuery<AppointmentWithPatient[]>({
    queryKey: ["doctor_appointments", doctorId, format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!doctorId) return [];
      
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      console.log("Fetching appointments for date:", formattedDate, "doctor:", doctorId);
      
      try {
        // Use our security definer RPC function
        const { data, error } = await supabase.rpc(
          'get_appointments_by_date',
          { 
            p_doctor_id: doctorId,
            p_date: formattedDate
          }
        );

        if (error) {
          console.error("Error fetching appointments via RPC:", error);
          throw error;
        }

        return data || [];
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
                    {appointment.patient_json?.first_name || "Unknown"} {appointment.patient_json?.last_name || "Patient"}
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
