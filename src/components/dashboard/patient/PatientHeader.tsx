import { Button } from "@/components/ui/button";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { LogOut } from "lucide-react";

type PatientHeaderProps = {
  firstName: string;
  onSignOut: () => void;
};

export const PatientHeader = ({ firstName, onSignOut }: PatientHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Welcome, {firstName || "Patient"}</h1>
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