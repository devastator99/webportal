
import React from "react";
import { Pill, Clock, CalendarDays } from "lucide-react";

interface Medication {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  timing?: string;
  instructions?: string;
}

interface MedicationsListProps {
  medications: Medication[];
}

export const MedicationsList: React.FC<MedicationsListProps> = ({ medications }) => {
  if (!medications.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Medications</h3>
      <div className="grid gap-3">
        {medications.map((med, index) => (
          <div 
            key={index} 
            className="p-3 rounded-lg border bg-white shadow-sm"
          >
            <div className="flex items-start gap-3">
              <Pill className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-1 flex-1">
                <h4 className="font-medium">{med.medication_name}</h4>
                <p className="text-sm text-gray-600">
                  Dosage: {med.dosage}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  {med.frequency}
                  {med.timing && ` - ${med.timing}`}
                </div>
                {med.duration && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4" />
                    Duration: {med.duration}
                  </div>
                )}
                {med.instructions && (
                  <p className="text-sm text-gray-600 mt-2">
                    {med.instructions}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
