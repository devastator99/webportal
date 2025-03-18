
import React, { useState } from "react";
import { Prescription } from "./usePrescriptions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AssignNutritionistDialog } from "./AssignNutritionistDialog";
import { PatientHealthPlan } from "../PatientHealthPlan";
import { ChevronDown, ChevronUp, CalendarClock, FilePlus, UserPlus } from "lucide-react";

interface PrescriptionHistoryProps {
  prescriptions: Prescription[];
  onAssignNutritionist?: (prescriptionId: string) => void;
}

export const PrescriptionHistory = ({ prescriptions, onAssignNutritionist }: PrescriptionHistoryProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showHealthPlan, setShowHealthPlan] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewHealthPlan = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowHealthPlan(true);
  };

  const handleAssignNutritionist = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowAssignDialog(true);
    if (onAssignNutritionist) {
      onAssignNutritionist(prescription.id);
    }
  };

  return (
    <div className="space-y-6">
      {prescriptions.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          No prescription history available.
        </div>
      ) : (
        <div className="space-y-4">
          {showHealthPlan && selectedPrescription && (
            <div className="mb-6">
              <Button 
                variant="outline" 
                className="mb-4"
                onClick={() => setShowHealthPlan(false)}
              >
                ← Back to Prescriptions
              </Button>
              <PatientHealthPlan patientId={selectedPrescription.patient_id} />
            </div>
          )}

          {!showHealthPlan && prescriptions.map((prescription, index) => (
            <Collapsible
              key={prescription.id}
              open={openIndex === index}
              onOpenChange={() => toggleAccordion(index)}
              className="border rounded-md"
            >
              <CollapsibleTrigger asChild>
                <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center">
                    <CalendarClock className="h-5 w-5 mr-2 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">
                        {prescription.diagnosis}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(prescription.created_at)}
                      </p>
                    </div>
                  </div>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <Separator className="mb-4" />
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Diagnosis</h4>
                    <p className="mt-1">{prescription.diagnosis}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Prescription</h4>
                    <p className="mt-1 whitespace-pre-line">{prescription.prescription}</p>
                  </div>
                  {prescription.notes && (
                    <div>
                      <h4 className="font-medium">Additional Notes</h4>
                      <p className="mt-1 whitespace-pre-line">{prescription.notes}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleViewHealthPlan(prescription)}
                    >
                      <FilePlus className="h-4 w-4" />
                      View Health Plan
                    </Button>
                    <Button
                      variant="outline" 
                      size="sm"
                      className="gap-1"
                      onClick={() => handleAssignNutritionist(prescription)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Assign Nutritionist
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {selectedPrescription && (
        <AssignNutritionistDialog
          isOpen={showAssignDialog}
          onClose={() => setShowAssignDialog(false)}
          patientId={selectedPrescription.patient_id}
          prescriptionId={selectedPrescription.id}
        />
      )}
    </div>
  );
};
