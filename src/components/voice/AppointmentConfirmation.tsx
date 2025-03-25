
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AppointmentConfirmationProps {
  appointmentDetails: string;
  onScheduleAnother: () => void;
  onClose: () => void;
}

export const AppointmentConfirmation: React.FC<AppointmentConfirmationProps> = ({
  appointmentDetails,
  onScheduleAnother,
  onClose
}) => {
  return (
    <div className="space-y-4">
      <Alert className="border-green-500 bg-green-50">
        <Check className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 text-sm">Appointment Scheduled</AlertTitle>
        <AlertDescription className="text-green-700 text-xs">
          {appointmentDetails}
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onScheduleAnother}
          className="text-xs"
        >
          Schedule Another
        </Button>
        <Button
          size="sm"
          onClick={onClose}
          className="bg-[#9b87f5] hover:bg-[#8a75e7] text-white text-xs"
        >
          Close
        </Button>
      </div>
    </div>
  );
};
