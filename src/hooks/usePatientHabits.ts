
import { useState, useCallback } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { HealthPlanItem, ProgressLog } from '@/interfaces/HealthHabits';
import { format } from 'date-fns';

export const usePatientHabits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<HealthPlanItem | null>(null);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<HealthPlanItem | null>(null);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [newLogValue, setNewLogValue] = useState<number>(0);
  const [newLogNotes, setNewLogNotes] = useState<string>("");
  
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch health plan items
  const { 
    data: healthPlanItems, 
    isLoading: isLoadingPlan, 
    error: planError,
    refetch: refetchHealthPlanItems
  } = useQuery({
    queryKey: ["patient_health_plan", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .rpc("get_patient_health_plan", {
          p_patient_id: user.id
        });
      
      if (error) {
        console.error("Error fetching health plan:", error);
        throw error;
      }
      
      return data as HealthPlanItem[];
    },
    enabled: !!user?.id
  });

  // Fetch habit logs using our new RPC function
  const { data: progressLogs, isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ["patient_habit_logs", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .rpc("get_patient_habit_logs", {
          p_user_id: user.id,
          p_habit_type: null
        });
      
      if (error) {
        console.error("Error fetching habit logs:", error);
        throw error;
      }
      
      return data as ProgressLog[];
    },
    enabled: !!user?.id
  });

  // Fetch habit summary using our new RPC function
  const { data: habitSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["patient_habit_summary", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .rpc("get_patient_habit_summary", {
          p_user_id: user.id
        });
      
      if (error) {
        console.error("Error fetching habit summary:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user?.id
  });

  const setupReminder = (item: HealthPlanItem) => {
    setSelectedReminder(item);
    setReminderDialogOpen(true);
  };

  const saveReminder = async () => {
    try {
      if (!selectedReminder || !user?.id) return;
      
      // This would connect to a notification service
      // For now, we'll just show a toast
      toast({
        title: "Reminder Set",
        description: `You'll be reminded about "${selectedReminder.description}" at ${selectedReminder.scheduled_time}`,
      });
      
      setReminderDialogOpen(false);
    } catch (error) {
      console.error("Error setting reminder:", error);
      toast({
        variant: "destructive",
        title: "Failed to set reminder",
        description: "Please try again later.",
      });
    }
  };

  const markAsCompleted = async () => {
    try {
      if (!selectedItem || !user?.id) return;
      
      // Map the type to habit_type
      let habitType: string;
      switch (selectedItem.type) {
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
        default:
          habitType = selectedItem.type;
      }
      
      // Use our RPC function to record the habit log
      const { data, error } = await supabase
        .rpc("save_habit_progress_log", {
          p_user_id: user.id,
          p_habit_type: habitType,
          p_value: newLogValue,
          p_date: new Date().toISOString().slice(0, 10),
          p_notes: newLogNotes,
          p_habit_id: selectedItem.id
        });
      
      if (error) {
        throw error;
      }
      
      // Refetch the logs
      refetchLogs();
      
      toast({
        title: "Habit Completed",
        description: "Your progress has been recorded.",
      });
      
      setCompletionDialogOpen(false);
    } catch (error) {
      console.error("Error recording habit completion:", error);
      toast({
        variant: "destructive", 
        title: "Failed to record completion",
        description: "Please try again later.",
      });
    }
  };

  // Group items by type
  const groupedItems: Record<string, HealthPlanItem[]> = {};
  
  healthPlanItems?.forEach(item => {
    if (!groupedItems[item.type]) {
      groupedItems[item.type] = [];
    }
    groupedItems[item.type].push(item);
  });

  // Prepare summary data
  const summaryData = {
    physical: habitSummary?.find(item => item.habit_type === 'physical')?.avg_value || 0,
    nutrition: habitSummary?.find(item => item.habit_type === 'nutrition')?.avg_value || 0,
    sleep: habitSummary?.find(item => item.habit_type === 'sleep')?.avg_value || 0,
    mindfulness: habitSummary?.find(item => item.habit_type === 'mindfulness')?.avg_value || 0
  };

  // Calculate percentages (assuming some target values)
  const targetValues = {
    physical: 60, // 60 minutes per day
    nutrition: 8, // score out of 10
    sleep: 8, // 8 hours
    mindfulness: 20 // 20 minutes
  };

  const percentages = {
    physical: Math.min(100, Math.round((summaryData.physical / targetValues.physical) * 100)),
    nutrition: Math.min(100, Math.round((summaryData.nutrition / targetValues.nutrition) * 100)),
    sleep: Math.min(100, Math.round((summaryData.sleep / targetValues.sleep) * 100)),
    mindfulness: Math.min(100, Math.round((summaryData.mindfulness / targetValues.mindfulness) * 100))
  };

  const isLoading = isLoadingPlan || isLoadingLogs || isLoadingSummary;

  return {
    healthPlanItems,
    progressLogs,
    isLoading,
    planError,
    groupedItems,
    summaryData,
    percentages,
    selectedItem,
    setSelectedItem,
    reminderDialogOpen,
    setReminderDialogOpen,
    selectedReminder,
    setSelectedReminder,
    completionDialogOpen,
    setCompletionDialogOpen,
    newLogValue,
    setNewLogValue,
    newLogNotes,
    setNewLogNotes,
    setupReminder,
    saveReminder,
    markAsCompleted,
    refetchHealthPlanItems: useCallback(() => {
      refetchHealthPlanItems();
    }, [refetchHealthPlanItems])
  };
};
