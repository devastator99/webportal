
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { HabitCard } from "./HabitCard";
import { AddHabitDialog } from "./AddHabitDialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HealthPlanItem } from "@/interfaces/HealthHabits";
import { ResponsiveText } from "@/components/ui/responsive-typography";

interface HabitTrackerProps {
  habits: HealthPlanItem[];
  onHabitAdded: () => void;
  habitCompletionStatus?: Record<string, boolean>;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ 
  habits, 
  onHabitAdded,
  habitCompletionStatus = {} 
}) => {
  const [addHabitDialogOpen, setAddHabitDialogOpen] = useState(false);
  const [completedHabits, setCompletedHabits] = useState<Record<string, boolean>>(habitCompletionStatus);
  const { toast } = useToast();

  const handleHabitCompletion = async (habitId: string, completed: boolean) => {
    try {
      const newCompletedHabits = { ...completedHabits, [habitId]: completed };
      setCompletedHabits(newCompletedHabits);
      
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;
      
      // Map the type to habit_type
      let habitType: string;
      switch (habit.type) {
        case 'food':
          habitType = 'nutrition';
          break;
        case 'exercise':
          habitType = 'physical';
          break;
        case 'sleep':
          habitType = 'sleep';
          break;
        case 'medication':
          habitType = 'medication';
          break;
        case 'mindfulness':
          habitType = 'mindfulness';
          break;
        default:
          habitType = habit.type;
      }
      
      // Save habit completion to database
      const { data, error } = await supabase.rpc("save_habit_progress_log", {
        p_user_id: habit.patient_id,
        p_habit_type: habitType,
        p_value: completed ? 1 : 0,
        p_date: new Date().toISOString().slice(0, 10),
        p_notes: completed ? "Habit completed" : "Habit not completed",
        p_habit_id: habitId
      });
      
      if (error) {
        console.error('Error saving habit completion:', error);
        toast({
          variant: "destructive",
          title: "Could not update habit",
          description: "There was a problem updating your habit completion status."
        });
        // Revert the UI change
        setCompletedHabits({ ...completedHabits });
      } else {
        toast({
          title: completed ? "Habit marked as complete" : "Habit marked as incomplete",
          description: `${habit.description} has been updated.`,
        });
      }
    } catch (error) {
      console.error('Error handling habit completion:', error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Could not update habit status."
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <ResponsiveText 
            as="h1" 
            mobileSize="xl" 
            tabletSize="2xl" 
            desktopSize="3xl" 
            weight="semibold" 
            className="text-[#7E69AB]"
          >
            Habit Tracker
          </ResponsiveText>
          <ResponsiveText 
            mobileSize="sm" 
            className="text-gray-500 mt-1"
          >
            Track and maintain your healthy habits
          </ResponsiveText>
        </div>
        <Button
          onClick={() => setAddHabitDialogOpen(true)} 
          className="bg-[#9b87f5]/90 hover:bg-[#7E69AB] text-sm px-3 py-1.5 h-auto"
          size="sm"
        >
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No habits found. Add some habits to start tracking.</p>
          </div>
        ) : (
          habits.map((habit) => (
            <HabitCard 
              key={habit.id} 
              habit={habit}
              completed={completedHabits[habit.id || '']} 
              onComplete={handleHabitCompletion} 
            />
          ))
        )}
      </div>

      <AddHabitDialog 
        open={addHabitDialogOpen}
        onOpenChange={setAddHabitDialogOpen}
        onHabitAdded={onHabitAdded}
      />
    </div>
  );
};
