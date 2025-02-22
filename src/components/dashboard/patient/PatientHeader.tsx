
import { Button } from "@/components/ui/button";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { LogOut, CalendarPlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

type PatientHeaderProps = {
  firstName: string | undefined;
  lastName?: string | undefined;
};

export const PatientHeader = ({ firstName, lastName }: PatientHeaderProps) => {
  const isMobile = useIsMobile();
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
      <h1 className="text-2xl sm:text-3xl font-bold truncate">
        Welcome {firstName}{lastName ? `, ${lastName}` : ""}
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
          onClick={signOut}
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
