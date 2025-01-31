import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Appointment {
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

  const { data: appointments } = useQuery({
    queryKey: ["doctor_appointments", doctorId, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_at,
          status,
          patient:profiles!appointments_patient_profile_fkey(first_name, last_name)
        `)
        .eq("doctor_id", doctorId)
        .eq("status", "scheduled")
        .gte("scheduled_at", format(selectedDate, "yyyy-MM-dd"))
        .lt("scheduled_at", format(new Date(selectedDate.getTime() + 86400000), "yyyy-MM-dd"))
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
  });

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
          {appointments?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments scheduled for this day</p>
          ) : (
            appointments?.map((appointment) => (
              <div
                key={appointment.id}
                className="flex justify-between items-center p-3 border rounded-lg"
              >
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