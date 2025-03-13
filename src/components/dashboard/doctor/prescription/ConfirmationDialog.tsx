
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  diagnosis: string;
  prescription: string;
  notes?: string;
  isSaving: boolean;
}

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  diagnosis,
  prescription,
  notes,
  isSaving
}: ConfirmationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Prescription</DialogTitle>
          <DialogDescription>
            Are you sure you want to save this prescription? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          <div className="p-3 bg-muted rounded-md">
            <p className="font-medium">Diagnosis:</p>
            <p className="text-sm">{diagnosis}</p>
          </div>
          <div className="p-3 bg-muted rounded-md">
            <p className="font-medium">Prescription:</p>
            <p className="text-sm whitespace-pre-wrap">{prescription}</p>
          </div>
          {notes && (
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">Notes:</p>
              <p className="text-sm whitespace-pre-wrap">{notes}</p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Confirm & Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
