
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  
  const { data: appointments = [] } = useQuery({
    queryKey: ["today_appointments", user?.id],
    queryFn: async () => {
      // Get today's date in the format YYYY-MM-DD
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_at,
          status,
          patient:profiles!appointments_patient_profile_fkey(
            first_name,
            last_name
          )
        `)
        .eq("doctor_id", user?.id)
        .gte("scheduled_at", today)
        .lt("scheduled_at", today + 'T23:59:59')
        .order("scheduled_at");

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user?.id
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments scheduled for today</p>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="flex justify-between items-center">
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
