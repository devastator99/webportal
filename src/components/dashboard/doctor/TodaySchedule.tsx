
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

  const { data: appointments = [], isLoading } = useQuery<AppointmentWithPatient[]>({
    queryKey: ["today_appointments", user?.id, formattedDate],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        // Use direct query instead of RPC to avoid ambiguous column error
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            scheduled_at,
            status,
            patient:profiles(first_name, last_name)
          `)
          .eq('appointments.doctor_id', user.id)
          .gte('scheduled_at', `${formattedDate}T00:00:00`)
          .lte('scheduled_at', `${formattedDate}T23:59:59`)
          .order('scheduled_at');

        if (error) {
          console.error("Error fetching today's appointments:", error);
          throw error;
        }

        // Transform data to match expected format
        return data?.map(item => ({
          id: item.id,
          scheduled_at: item.scheduled_at,
          status: item.status,
          patient: item.patient || { first_name: "Unknown", last_name: "Patient" }
        })) || [];
      } catch (error) {
        console.error("Error in today's schedule fetch:", error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter for upcoming appointments today (exclude past appointments)
  const upcomingAppointments = appointments.filter(
    (appointment) => isFuture(new Date(appointment.scheduled_at))
  );

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
