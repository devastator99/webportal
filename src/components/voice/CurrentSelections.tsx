
import { User, Calendar, Clock } from "lucide-react";
import { format, parse } from "date-fns";

interface CurrentSelectionsProps {
  selectedPatient: string | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  patients: any[];
}

export const CurrentSelections: React.FC<CurrentSelectionsProps> = ({
  selectedPatient,
  selectedDate,
  selectedTime,
  patients
}) => {
  return (
    <div className="border rounded-md p-3 space-y-3">
      <h3 className="font-medium text-center text-sm">Current Selections</h3>
      
      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[#9b87f5]" />
          <span className="font-medium text-xs">Patient:</span>
          <span className="text-xs">{selectedPatient 
            ? patients.find(p => p.id === selectedPatient)?.first_name + ' ' + 
              patients.find(p => p.id === selectedPatient)?.last_name 
            : "Not selected"}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#9b87f5]" />
          <span className="font-medium text-xs">Date:</span>
          <span className="text-xs">{selectedDate ? format(selectedDate, "EEE, MMM d, yyyy") : "Not selected"}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#9b87f5]" />
          <span className="font-medium text-xs">Time:</span>
          <span className="text-xs">{selectedTime 
            ? format(parse(selectedTime, "HH:mm", new Date()), "h:mm a") 
            : "Not selected"}</span>
        </div>
      </div>
    </div>
  );
};
