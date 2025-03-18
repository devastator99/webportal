
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, UserPlus } from "lucide-react";
import { AssignNutritionistDialog } from "./AssignNutritionistDialog";

interface PrescriptionFormProps {
  diagnosis: string;
  setDiagnosis: (value: string) => void;
  prescription: string;
  setPrescription: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  onSavePrescription: () => void;
  isSaving: boolean;
  onPrescriptionSaved?: (prescriptionId: string) => void;
}

export const PrescriptionForm = ({
  diagnosis,
  setDiagnosis,
  prescription,
  setPrescription,
  notes,
  setNotes,
  onSavePrescription,
  isSaving,
  onPrescriptionSaved
}: PrescriptionFormProps) => {
  const [savedPrescriptionId, setSavedPrescriptionId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const handleSavePrescription = () => {
    onSavePrescription();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnosis <span className="text-red-500">*</span></Label>
        <Input
          id="diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Enter diagnosis"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prescription">Prescription <span className="text-red-500">*</span></Label>
        <Textarea
          id="prescription"
          value={prescription}
          onChange={(e) => setPrescription(e.target.value)}
          placeholder="Write prescription details"
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          className="gap-2 flex-1"
          onClick={handleSavePrescription}
          disabled={isSaving}
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Prescription"}
        </Button>
        
        {savedPrescriptionId && patientId && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowAssignDialog(true)}
          >
            <UserPlus className="h-4 w-4" />
            Assign Nutritionist
          </Button>
        )}
      </div>

      {savedPrescriptionId && patientId && (
        <AssignNutritionistDialog
          isOpen={showAssignDialog}
          onClose={() => setShowAssignDialog(false)}
          patientId={patientId}
          prescriptionId={savedPrescriptionId}
        />
      )}
    </div>
  );
};
