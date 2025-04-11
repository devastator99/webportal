
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { HealthPlanItem } from '@/interfaces/HealthHabits';

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: HealthPlanItem | null;
  newLogValue: number;
  setNewLogValue: (value: number) => void;
  newLogNotes: string;
  setNewLogNotes: (notes: string) => void;
  onMarkAsCompleted: () => void;
  typeIcons: Record<string, React.ReactNode>;
}

export const CompletionDialog: React.FC<CompletionDialogProps> = ({
  open,
  onOpenChange,
  selectedItem,
  newLogValue,
  setNewLogValue,
  newLogNotes,
  setNewLogNotes,
  onMarkAsCompleted,
  typeIcons
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Completed</DialogTitle>
          <DialogDescription>
            Record your progress for this health plan item
          </DialogDescription>
        </DialogHeader>
        
        {selectedItem && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              {typeIcons[selectedItem.type as keyof typeof typeIcons] || 
                <Activity className="h-5 w-5 text-gray-500" />}
              <div>
                <p className="font-medium">{selectedItem.description}</p>
                <p className="text-sm text-muted-foreground">{selectedItem.scheduled_time} • {selectedItem.frequency}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Record Value:
                <input 
                  type="number" 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 mt-1" 
                  value={newLogValue} 
                  onChange={(e) => setNewLogValue(parseFloat(e.target.value))}
                  min="0"
                  step="0.1"
                  placeholder={selectedItem.type === 'exercise' ? "Minutes" : 
                    selectedItem.type === 'food' ? "Rating (1-10)" : 
                    selectedItem.type === 'sleep' ? "Hours" : "Minutes"}
                />
              </label>
              
              <label className="text-sm font-medium">
                Notes:
                <textarea 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 mt-1" 
                  value={newLogNotes} 
                  onChange={(e) => setNewLogNotes(e.target.value)}
                  placeholder="Add any notes about this activity..."
                  rows={2}
                />
              </label>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onMarkAsCompleted}>
            Mark as Completed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
