
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "lucide-react";
import { format, isToday, isFuture } from "date-fns";
import { Separator } from "@/components/ui/separator";

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

const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
  <div className="flex items-start space-x-4 p-4 border rounded-lg">
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
);

export const AppointmentsList = ({
  appointments
}: AppointmentsListProps) => {
  // Filter appointments for today and future
  const todayAppointments = appointments.filter(
    apt => isToday(new Date(apt.scheduled_at)) && apt.status === 'scheduled'
  );

  const futureAppointments = appointments.filter(
    apt => isFuture(new Date(apt.scheduled_at)) && !isToday(new Date(apt.scheduled_at)) && apt.status === 'scheduled'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Upcoming Appointments Details</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {(todayAppointments.length > 0 || futureAppointments.length > 0) ? (
            <div className="space-y-6">
              {/* Today's Appointments */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Today's Appointments</h3>
                <div className="space-y-4">
                  {todayAppointments.length > 0 ? (
                    todayAppointments.map(appointment => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No appointments scheduled for today</p>
                  )}
                </div>
              </div>

              {/* Separator between sections */}
              <Separator className="my-4" />

              {/* Future Appointments */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Upcoming Appointments</h3>
                <div className="space-y-4">
                  {futureAppointments.length > 0 ? (
                    futureAppointments.map(appointment => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No future appointments scheduled</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No upcoming appointments
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
