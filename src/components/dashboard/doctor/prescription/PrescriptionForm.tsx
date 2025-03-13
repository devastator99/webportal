
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";

interface PrescriptionFormProps {
  diagnosis: string;
  setDiagnosis: (value: string) => void;
  prescription: string;
  setPrescription: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  onSavePrescription: () => void;
  isSaving: boolean;
}

export const PrescriptionForm = ({
  diagnosis,
  setDiagnosis,
  prescription,
  setPrescription,
  notes,
  setNotes,
  onSavePrescription,
  isSaving
}: PrescriptionFormProps) => {
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

      <Button
        className="w-full gap-2"
        onClick={onSavePrescription}
        disabled={isSaving}
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Saving..." : "Save Prescription"}
      </Button>
    </div>
  );
};
