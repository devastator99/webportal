
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PatientHealthPlan } from "../PatientHealthPlan";

interface HealthPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
}

export const HealthPlanDialog = ({ 
  isOpen, 
  onClose, 
  patientId 
}: HealthPlanDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Patient Health Plan</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <PatientHealthPlan patientId={patientId} />
        </div>
        
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
