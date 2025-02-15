
import { Button } from "@/components/ui/button";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { LogOut, CalendarPlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type PatientHeaderProps = {
  firstName: string | undefined;
  lastName?: string | undefined;
};

export const PatientHeader = ({ firstName, lastName }: PatientHeaderProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
      toast({
        title: "Signed out successfully"
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message
      });
    }
  };

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
          onClick={handleSignOut}
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
