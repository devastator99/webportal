
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "lucide-react";

type Appointment = {
  id: string;
  scheduled_at: string;
  status: string;
  doctor: {
    first_name: string;
    last_name: string;
  };
};

type AppointmentsListProps = {
  appointments: Appointment[];
};

export const AppointmentsList = ({ appointments }: AppointmentsListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming appointments
              </p>
            ) : (
              appointments.map((appointment) => (
                <div key={appointment.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(appointment.scheduled_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="capitalize px-2 py-1 bg-primary/10 rounded-full text-sm">
                    {appointment.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
