
import { Button } from "@/components/ui/button";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { CalendarPlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

type PatientHeaderProps = {
  actionButton?: React.ReactNode;
};

export const PatientHeader = ({ actionButton }: PatientHeaderProps) => {
  const isMobile = useIsMobile();
  
  const scheduleButton = (
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
  );

  // Combine the schedule button with any additional action buttons
  const combinedButtons = actionButton ? (
    <div className="flex items-center gap-3">
      {scheduleButton}
      {actionButton}
    </div>
  ) : scheduleButton;

  return <DashboardHeader actionButton={combinedButtons} />;
};
