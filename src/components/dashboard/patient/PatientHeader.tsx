
import { Button } from "@/components/ui/button";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { LogOut } from "lucide-react";

type PatientHeaderProps = {
  firstName: string | undefined;
  lastName?: string | undefined;
  onSignOut: () => void;
};

export const PatientHeader = ({ firstName, lastName, onSignOut }: PatientHeaderProps) => {
  const displayName = firstName 
    ? `${firstName}${lastName ? ` ${lastName}` : ''}`
    : "Patient";

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Welcome, {displayName}</h1>
      <div className="flex gap-4">
        <ScheduleAppointment>
          <Button>Schedule Appointment</Button>
        </ScheduleAppointment>
        <Button 
          variant="outline" 
          onClick={onSignOut}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
