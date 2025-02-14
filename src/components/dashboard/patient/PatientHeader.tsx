
import { Button } from "@/components/ui/button";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { LogOut, CalendarPlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type PatientHeaderProps = {
  firstName: string | undefined;
  lastName?: string | undefined;
  onSignOut: () => void;
};

export const PatientHeader = ({ firstName, lastName, onSignOut }: PatientHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
      <h1 className="text-2xl sm:text-3xl font-bold truncate">
        Welcome, {firstName && lastName ? `${firstName} ${lastName}` : "Patient"}
      </h1>
      <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
        <ScheduleAppointment>
          <Button 
            className="flex-1 sm:flex-initial gap-2" 
            size={isMobile ? "lg" : "default"}
            variant="default"
          >
            <CalendarPlus className="h-4 w-4" />
            Schedule Appointment
          </Button>
        </ScheduleAppointment>
        <Button 
          variant="outline" 
          onClick={onSignOut}
          className="gap-2 flex-1 sm:flex-initial"
          size={isMobile ? "lg" : "default"}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
