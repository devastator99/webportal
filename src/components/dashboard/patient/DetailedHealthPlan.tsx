
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Bell, CheckCircle2, Trash2, Edit } from "lucide-react";
import { HealthPlanItem } from '@/interfaces/HealthHabits';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface TypeIconsProps {
  [key: string]: React.ReactNode;
}

interface DetailedHealthPlanProps {
  groupedItems: Record<string, HealthPlanItem[]>;
  typeIcons: TypeIconsProps;
  onSetupReminder: (item: HealthPlanItem) => void;
  onMarkComplete: (item: HealthPlanItem) => void;
  emptyMessage?: string;
  isPatientCreated?: boolean;
}

export const DetailedHealthPlan: React.FC<DetailedHealthPlanProps> = ({ 
  groupedItems, 
  typeIcons, 
  onSetupReminder, 
  onMarkComplete,
  emptyMessage = "No health plan items available.",
  isPatientCreated = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const deleteHabit = async (itemId: string) => {
    if (!user?.id || !itemId) return;
    
    try {
      const { error } = await supabase
        .from('health_plan_items')
        .delete()
        .eq('id', itemId)
        .eq('patient_id', user.id)
        .eq('created_by', user.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Habit Deleted",
        description: "Your habit has been deleted successfully.",
      });
      
      // Reload the page or refetch data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error("Error deleting habit:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the habit. Please try again.",
      });
    }
  };

  // Check if there are any items
  const hasItems = Object.keys(groupedItems).length > 0;

  return (
    <div className="space-y-6">
      {!hasItems && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      )}
      
      {Object.entries(groupedItems).map(([type, items]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {typeIcons[type as keyof typeof typeIcons] || <Activity className="h-5 w-5" />}
              {type.charAt(0).toUpperCase() + type.slice(1)} Plan
            </CardTitle>
            <CardDescription>
              {isPatientCreated ? "Your personal " : "Your personalized "} 
              {type} recommendations
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
                      onClick={() => onSetupReminder(item)}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Remind
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onMarkComplete(item)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Complete
                    </Button>
                    
                    {isPatientCreated && item.created_by === user?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this habit from your health plan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => item.id && deleteHabit(item.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
