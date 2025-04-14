
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HealthPlanItem } from '@/interfaces/HealthHabits';
import { TimePicker } from '@/components/ui/time-picker';

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
  typeIcons,
}) => {
  const [reminderTime, setReminderTime] = useState(selectedReminder?.scheduled_time || '9:00 AM');
  const [frequency, setFrequency] = useState<string>('daily');

  const handleSave = () => {
    // Here you'd normally save to a database
    onSaveReminder();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedReminder && typeIcons[selectedReminder.type]}
            Set Reminder
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {selectedReminder && (
            <div className="mb-4">
              <h3 className="font-medium">{selectedReminder.description}</h3>
              <p className="text-sm text-muted-foreground">
                Scheduled for: {selectedReminder.scheduled_time}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <TimePicker
              id="reminder-time"
              label="Reminder Time"
              value={reminderTime}
              onChange={setReminderTime}
            />

            <div className="space-y-2">
              <Label htmlFor="reminder-frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger id="reminder-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Just once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Reminder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
