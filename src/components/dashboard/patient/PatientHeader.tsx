
import { Button } from "@/components/ui/button";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type PatientHeaderProps = {
  firstName: string | undefined;
  lastName?: string | undefined;
  onSignOut: () => void;
};

export const PatientHeader = ({ firstName, lastName, onSignOut }: PatientHeaderProps) => {
  const isMobile = useIsMobile();
  const displayName = firstName 
    ? `${firstName}${lastName ? ` ${lastName}` : ''}`
    : "Patient";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl sm:text-3xl font-bold">Welcome, {displayName}</h1>
      <div className="flex gap-2 sm:gap-4">
        <ScheduleAppointment>
          <Button className="flex-1 sm:flex-initial" size={isMobile ? "lg" : "default"}>
            Schedule Appointment
          </Button>
        </ScheduleAppointment>
        <Button 
          variant="outline" 
          onClick={onSignOut}
          className="gap-2"
          size={isMobile ? "lg" : "default"}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
