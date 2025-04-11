
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { HealthPlanItem } from '@/interfaces/HealthHabits';

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedReminder: HealthPlanItem | null;
  onSaveReminder: () => void;
  typeIcons: Record<string, React.ReactNode>;
}

export const ReminderDialog: React.FC<ReminderDialogProps> = ({
  open,
  onOpenChange,
  selectedReminder,
  onSaveReminder,
  typeIcons
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Reminder</DialogTitle>
          <DialogDescription>
            Set a reminder for this health plan item
          </DialogDescription>
        </DialogHeader>
        
        {selectedReminder && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              {typeIcons[selectedReminder.type as keyof typeof typeIcons] || 
                <Activity className="h-5 w-5 text-gray-500" />}
              <div>
                <p className="font-medium">{selectedReminder.description}</p>
                <p className="text-sm text-muted-foreground">{selectedReminder.scheduled_time} • {selectedReminder.frequency}</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              You'll receive a notification reminder for this health plan item.
              For now, this is a placeholder as the notification system needs to be implemented.
            </p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSaveReminder}>
            Set Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
