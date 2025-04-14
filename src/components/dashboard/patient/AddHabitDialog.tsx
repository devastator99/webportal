
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TimePicker } from "@/components/ui/time-picker";

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHabitAdded: () => void;
}

export const AddHabitDialog: React.FC<AddHabitDialogProps> = ({ 
  open, 
  onOpenChange,
  onHabitAdded
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [description, setDescription] = useState('');
  const [habitType, setHabitType] = useState<string>('');
  const [frequency, setFrequency] = useState('');
  const [scheduledTime, setScheduledTime] = useState('9:00 AM');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !habitType || !frequency || !scheduledTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (!user?.id) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to add habits",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Insert data using available fields in the health_plan_items table
      const { error } = await supabase.from('health_plan_items').insert({
        patient_id: user.id,
        type: habitType,
        scheduled_time: scheduledTime,
        description: description,
        frequency: frequency,
        duration: duration || null,
        nutritionist_id: user.id // Use the same user.id since the patient is creating it
      });
      
      if (error) {
        console.error("Error adding habit:", error);
        throw error;
      }
      
      toast({
        title: "Habit Added",
        description: "Your habit has been added successfully",
      });
      
      // Reset form
      setDescription('');
      setHabitType('');
      setFrequency('');
      setScheduledTime('9:00 AM');
      setDuration('');
      
      // Close dialog and notify parent
      onOpenChange(false);
      onHabitAdded();
      
    } catch (error) {
      console.error("Error adding habit:", error);
      toast({
        title: "Failed to add habit",
        description: "An error occurred while adding your habit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Habit</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="habit-type">Habit Type</Label>
            <Select
              value={habitType}
              onValueChange={setHabitType}
            >
              <SelectTrigger id="habit-type">
                <SelectValue placeholder="Select a habit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food">Nutrition</SelectItem>
                <SelectItem value="exercise">Exercise</SelectItem>
                <SelectItem value="sleep">Sleep</SelectItem>
                <SelectItem value="mindfulness">Mindfulness</SelectItem>
                <SelectItem value="medication">Medication</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is your habit?"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={frequency}
              onValueChange={setFrequency}
            >
              <SelectTrigger id="frequency">
                <SelectValue placeholder="How often?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Weekdays">Weekdays</SelectItem>
                <SelectItem value="Weekends">Weekends</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <TimePicker 
            id="scheduled-time"
            label="Scheduled Time"
            value={scheduledTime}
            onChange={setScheduledTime}
          />
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (optional)</Label>
            <Input
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 30 minutes"
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
