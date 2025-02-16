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
export const AppointmentsList = ({
  appointments
}: AppointmentsListProps) => {
  return <Card>
      
      
    </Card>;
};