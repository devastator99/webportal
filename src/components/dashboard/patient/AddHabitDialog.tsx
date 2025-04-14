
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const [scheduledTime, setScheduledTime] = useState('');
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
      
      // Use the RPC to save the health plan item
      const { data, error } = await supabase.rpc('save_health_plan_item', {
        p_patient_id: user.id,
        p_type: habitType,
        p_scheduled_time: scheduledTime,
        p_description: description,
        p_frequency: frequency,
        p_duration: duration || null,
        p_created_by: user.id,
        p_creator_type: 'patient'
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
      setScheduledTime('');
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
          
          <div className="space-y-2">
            <Label htmlFor="scheduled-time">Scheduled Time</Label>
            <Input
              id="scheduled-time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              placeholder="e.g. Morning, 9:00 AM"
            />
          </div>
          
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
