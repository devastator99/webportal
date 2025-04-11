
import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Dumbbell, 
  Utensils, 
  Moon, 
  Brain, 
  AlertCircle, 
  CheckCircle2,
  Bell,
  Pill
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { HabitsProgressCharts } from "@/components/dashboard/patient/HabitsProgressCharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface HealthPlanItem {
  id?: string;
  type: 'food' | 'exercise' | 'medication';
  scheduled_time: string;
  description: string;
  frequency: string;
  duration: string | null;
  patient_id?: string;
  nutritionist_id?: string;
}

interface ProgressLog {
  id: string;
  habit_id: string | null;
  habit_type: string;
  value: number;
  date: string;
  notes: string | null;
  created_at: string;
}

const typeIcons = {
  food: <Utensils className="h-5 w-5 text-green-500" />,
  exercise: <Dumbbell className="h-5 w-5 text-blue-500" />,
  meditation: <Brain className="h-5 w-5 text-purple-500" />,
  sleep: <Moon className="h-5 w-5 text-indigo-500" />
};

// Helper function to convert database habit type to UI type
const mapHabitTypeToUIType = (habitType: string): 'food' | 'exercise' | 'meditation' | 'sleep' => {
  switch (habitType) {
    case 'nutrition':
      return 'food';
    case 'physical':
      return 'exercise';
    case 'sleep':
      return 'sleep';
    case 'mindfulness':
      return 'meditation';
    default:
      return 'exercise';
  }
};

const PatientHabitsPage = () => {
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
  const { data: healthPlanItems, isLoading: isLoadingPlan, error: planError } = useQuery({
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

  const isLoading = isLoadingPlan || isLoadingLogs || isLoadingSummary;

  if (isLoading) {
    return (
      <div className="container pt-16 pb-8 flex justify-center items-center h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (planError) {
    return (
      <div className="container pt-16 pb-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Health Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was an error loading your health plan. Please try again later.</p>
            <p className="text-sm text-muted-foreground mt-2">{(planError as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  return (
    <div className="container pt-16 pb-8">
      <h1 className="text-2xl font-bold mb-2">My Health Plan</h1>
      <p className="text-muted-foreground mb-6">
        Track your habits and follow your personalized health plan
      </p>

      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="plan">Full Plan</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Today's Habits
                </CardTitle>
                <CardDescription>
                  Your health plan for {format(new Date(), 'MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(!healthPlanItems || healthPlanItems.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg mb-2">No Health Plan Found</h3>
                    <p className="text-muted-foreground">
                      You don't have any habits or health plan items assigned yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {healthPlanItems.slice(0, 5).map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {typeIcons[item.type as keyof typeof typeIcons] || 
                              <Activity className="h-5 w-5 text-gray-500" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.description}</p>
                            <p className="text-xs text-muted-foreground">{item.scheduled_time} • {item.frequency}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setNewLogValue(0);
                              setNewLogNotes("");
                              setCompletionDialogOpen(true);
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setupReminder(item)}
                          >
                            <Bell className="h-4 w-4 text-blue-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button variant="outline" size="sm" asChild>
                  <a href="#plan-section">View full plan</a>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Progress Summary
                </CardTitle>
                <CardDescription>
                  Your health journey progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Dumbbell className="h-4 w-4 text-blue-500" />
                        Physical Activity
                      </h4>
                      <Badge variant="outline">{percentages.physical}%</Badge>
                    </div>
                    <Progress value={percentages.physical} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Utensils className="h-4 w-4 text-green-500" />
                        Nutrition
                      </h4>
                      <Badge variant="outline">{percentages.nutrition}%</Badge>
                    </div>
                    <Progress value={percentages.nutrition} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Moon className="h-4 w-4 text-indigo-500" />
                        Sleep
                      </h4>
                      <Badge variant="outline">{percentages.sleep}%</Badge>
                    </div>
                    <Progress value={percentages.sleep} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        Mindfulness
                      </h4>
                      <Badge variant="outline">{percentages.mindfulness}%</Badge>
                    </div>
                    <Progress value={percentages.mindfulness} className="h-2" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button variant="outline" size="sm" onClick={() => {}}>
                  View detailed stats
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Progress Charts</CardTitle>
              <CardDescription>Visual representation of your health habits</CardDescription>
            </CardHeader>
            <CardContent>
              <HabitsProgressCharts />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="plan" id="plan-section">
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([type, items]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {typeIcons[type as keyof typeof typeIcons] || <Activity className="h-5 w-5" />}
                    {type.charAt(0).toUpperCase() + type.slice(1)} Plan
                  </CardTitle>
                  <CardDescription>
                    Your personalized {type} recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="p-4 bg-muted/30 rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{item.description}</h3>
                          <Badge variant="outline">{item.frequency}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Scheduled for: {item.scheduled_time}</p>
                        {item.duration && (
                          <p className="text-sm text-muted-foreground">Duration: {item.duration}</p>
                        )}
                        <div className="pt-2 flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setupReminder(item)}
                          >
                            <Bell className="mr-2 h-4 w-4" />
                            Set Reminder
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setNewLogValue(0);
                              setNewLogNotes("");
                              setCompletionDialogOpen(true);
                            }}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark Complete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Set Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
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
            <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveReminder}>
              Set Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Mark as Complete Dialog */}
      <Dialog open={completionDialogOpen} onOpenChange={setCompletionDialogOpen}>
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
            <Button variant="outline" onClick={() => setCompletionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={markAsCompleted}>
              Mark as Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientHabitsPage;
