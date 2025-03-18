
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ClipboardList, 
  UserPlus, 
  Eye,
  CalendarCheck
} from "lucide-react";
import { PrescriptionPrintTemplate } from "./PrescriptionPrintTemplate";
import { HealthPlanDialog } from "./HealthPlanDialog";

interface Prescription {
  id: string;
  created_at: string;
  diagnosis: string;
  prescription: string;
  notes: string;
}

interface PrescriptionHistoryProps {
  prescriptions: Prescription[];
  onAssignNutritionist: (prescriptionId: string) => void;
}

export const PrescriptionHistory = ({ 
  prescriptions, 
  onAssignNutritionist 
}: PrescriptionHistoryProps) => {
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showHealthPlan, setShowHealthPlan] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
  };

  const handleClosePrintView = () => {
    setSelectedPrescription(null);
  };

  const handleViewHealthPlan = (patientId: string) => {
    setSelectedPatientId(patientId);
    setShowHealthPlan(true);
  };

  return (
    <div className="space-y-4">
      {prescriptions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No prescriptions found for this patient.
        </div>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div 
                key={prescription.id} 
                className="border rounded-md p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-medium">
                      {prescription.diagnosis}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(prescription.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewPrescription(prescription)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onAssignNutritionist(prescription.id)}
                    className="flex items-center gap-1"
                  >
                    <UserPlus className="h-4 w-4" />
                    Assign Nutritionist
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewHealthPlan(prescription.patient_id)}
                    className="flex items-center gap-1"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    View Health Plan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {selectedPrescription && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Prescription</h2>
              <Button variant="outline" onClick={handleClosePrintView}>
                Close
              </Button>
            </div>
            <PrescriptionPrintTemplate prescription={selectedPrescription} />
          </div>
        </div>
      )}

      {showHealthPlan && (
        <HealthPlanDialog
          isOpen={showHealthPlan}
          onClose={() => setShowHealthPlan(false)}
          patientId={selectedPatientId}
        />
      )}
    </div>
  );
};
