
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
import { Activity, Apple, Brain, Droplet, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHabitAdded: () => void;
}

const habitTypes = [
  { value: 'water', label: 'Drink Water', icon: Droplet, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  { value: 'exercise', label: 'Exercise', icon: Activity, color: 'text-green-500', bgColor: 'bg-green-100' },
  { value: 'food', label: 'Balanced Meals', icon: Apple, color: 'text-red-500', bgColor: 'bg-red-100' },
  { value: 'sleep', label: 'Sleep 7+ Hours', icon: Moon, color: 'text-indigo-500', bgColor: 'bg-indigo-100' },
  { value: 'mindfulness', label: 'Meditation', icon: Brain, color: 'text-purple-500', bgColor: 'bg-purple-100' },
];

export const AddHabitDialog: React.FC<AddHabitDialogProps> = ({ 
  open, 
  onOpenChange,
  onHabitAdded
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [description, setDescription] = useState('');
  const [habitType, setHabitType] = useState<string>('');
  const [frequency, setFrequency] = useState('Daily');
  const [scheduledTime, setScheduledTime] = useState('9:00 AM');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get the label for a given habit type
  const getHabitLabel = (type: string) => {
    const habitType = habitTypes.find(ht => ht.value === type);
    return habitType ? habitType.label : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!habitType) {
      toast({
        title: "Missing information",
        description: "Please select a habit type",
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
      
      const habitDescription = description || getHabitLabel(habitType);

      // Insert data using available fields in the health_plan_items table
      const { error } = await supabase.from('health_plan_items').insert({
        patient_id: user.id,
        type: habitType,
        scheduled_time: scheduledTime,
        description: habitDescription,
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
      setFrequency('Daily');
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
          <DialogTitle className="text-2xl font-bold text-amber-800">Add New Habit</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="habit-type" className="text-amber-800">Habit Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {habitTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.value}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg cursor-pointer border transition-all",
                      habitType === type.value 
                        ? "border-[#9b87f5] bg-[#E5DEFF] shadow-sm" 
                        : "border-gray-200 hover:border-[#9b87f5] hover:bg-gray-50"
                    )}
                    onClick={() => setHabitType(type.value)}
                  >
                    <div className={cn("p-2 rounded-full", type.bgColor)}>
                      <Icon className={cn("h-5 w-5", type.color)} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{type.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-amber-800">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Custom habit description"
              className="border-amber-200 focus:border-amber-400"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="frequency" className="text-amber-800">Frequency</Label>
            <Select
              value={frequency}
              onValueChange={setFrequency}
            >
              <SelectTrigger id="frequency" className="border-amber-200 focus:border-amber-400">
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
            <Label htmlFor="duration" className="text-amber-800">Duration (optional)</Label>
            <Input
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 30 minutes"
              className="border-amber-200 focus:border-amber-400"
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-amber-200 text-amber-800 hover:bg-amber-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-[#9b87f5] hover:bg-[#7E69AB]"
            >
              {isSubmitting ? "Adding..." : "Add Habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
