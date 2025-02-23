
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

type Appointment = {
  id: string;
  scheduled_at: string;
  status: string;
  doctor: {
    first_name: string | null;
    last_name: string | null;
  };
};

type AppointmentsListProps = {
  appointments: Appointment[];
};

export const AppointmentsList = ({
  appointments
}: AppointmentsListProps) => {
  return <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Upcoming Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="space-y-1">
                    <p className="font-medium text-base">
                      Dr. {appointment.doctor.first_name || ''} {appointment.doctor.last_name || ''}
                    </p>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>
                        Date: {format(new Date(appointment.scheduled_at), 'PPPP')}
                      </p>
                      <p>
                        Time: {format(new Date(appointment.scheduled_at), 'p')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No upcoming appointments
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>;
};
