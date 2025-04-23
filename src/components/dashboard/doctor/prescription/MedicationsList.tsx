
import React from "react";
import { Pill, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Medication {
  medication_name: string;
  dosage: string;
  frequency: string;
  timing?: string;
  duration?: string;
  instructions?: string;
}

interface MedicationsListProps {
  medications: Medication[];
  onRemove?: (index: number) => void;
}

export const MedicationsList: React.FC<MedicationsListProps> = ({ medications, onRemove }) => {
  if (!medications.length) {
    return (
      <div className="text-center p-4 text-gray-500 text-sm">
        No medications added yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {medications.map((med, index) => (
          <div 
            key={index} 
            className="p-3 rounded-lg border bg-white shadow-sm"
          >
            <div className="flex items-start gap-3">
              <Pill className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-1 flex-grow">
                <div className="flex justify-between">
                  <h4 className="font-medium">{med.medication_name}</h4>
                  <span className="text-sm font-medium text-gray-600">{med.dosage}</span>
                </div>
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Frequency:</span> {med.frequency}
                  </div>
                  {med.timing && (
                    <div>
                      <span className="font-medium">Timing:</span> {med.timing}
                    </div>
                  )}
                  {med.duration && (
                    <div>
                      <span className="font-medium">Duration:</span> {med.duration}
                    </div>
                  )}
                </div>
                {med.instructions && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Instructions:</span> {med.instructions}
                  </p>
                )}
              </div>
              {onRemove && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => onRemove(index)}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
