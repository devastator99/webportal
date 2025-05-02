import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PatientPageLayout } from '@/components/layout/PatientPageLayout';
import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { usePatientHabits } from '@/hooks/usePatientHabits';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const PatientHabitsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('today');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [habitEntries, setHabitEntries] = useState<Record<string, boolean>>({});
  const { habits, isLoading, summaryData, percentages, habitSummary, refetch } = usePatientHabits();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (habits && habits.length > 0) {
      const initialEntries: Record<string, boolean> = {};
      habits.forEach(habit => {
        initialEntries[habit.id] = false;
      });
      setHabitEntries(initialEntries);
    }
  }, [habits]);

  const handleHabitToggle = (habitId: string) => {
    setHabitEntries(prev => ({
      ...prev,
      [habitId]: !prev[habitId]
    }));
  };

  const handleSubmitHabits = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const entries = Object.entries(habitEntries).map(([habitId, completed]) => ({
        habit_id: habitId,
        patient_id: user.id,
        completed,
        entry_date: new Date().toISOString().split('T')[0]
      }));
      
      const { error } = await supabase
        .from('habit_entries')
        .upsert(entries, { onConflict: 'habit_id, patient_id, entry_date' });
      
      if (error) throw error;
      
      toast({
        title: "Habits updated",
        description: "Your habit tracking has been updated successfully.",
      });
      
      refetch();
    } catch (error) {
      console.error('Error submitting habits:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating your habits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PatientPageLayout
      title="Health Habits"
      description="Track your daily health habits and activities"
    >
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-5 w-5 text-[#7E69AB]" />
        <h2 className="text-xl font-semibold">Your Health Habits</h2>
      </div>
      
      <ErrorBoundary>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Summary Cards */}
          {!isLoading && summaryData && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Overall Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{percentages.overall}%</div>
                  <Progress value={percentages.overall} className="h-2 mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {summaryData.completed} of {summaryData.total} habits completed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Streak</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData.streak} days</div>
                  <Progress value={(summaryData.streak / 7) * 100} className="h-2 mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {summaryData.streak === 7 ? "Perfect week!" : `${7 - summaryData.streak} more days for a perfect week`}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{percentages.monthly}%</div>
                  <Progress value={percentages.monthly} className="h-2 mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on the last 30 days
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        
        <Separator className="my-6" />
        
        <Tabs defaultValue="today" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="today">Today's Habits</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="all">All Habits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading your habits...</div>
            ) : habits && habits.length > 0 ? (
              <>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {habits.map(habit => (
                    <Card key={habit.id} className={habitEntries[habit.id] ? "border-green-500/50" : ""}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center justify-between">
                          {habit.name}
                          <Button 
                            variant={habitEntries[habit.id] ? "default" : "outline"} 
                            size="sm"
                            onClick={() => handleHabitToggle(habit.id)}
                            className={habitEntries[habit.id] ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {habitEntries[habit.id] ? "Completed" : "Mark Complete"}
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{habit.description}</p>
                        {habit.target_value && (
                          <p className="text-xs mt-2">Target: {habit.target_value} {habit.unit}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={handleSubmitHabits} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Today's Progress"}
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p>No habits have been assigned to you yet.</p>
                  <p className="text-muted-foreground text-sm mt-2">
                    Your care team will add habits for you to track.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Habit History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {habitSummary && habitSummary.length > 0 ? (
                    habitSummary.map((day, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{format(new Date(day.date), 'EEEE, MMMM d')}</p>
                          <p className="text-sm text-muted-foreground">
                            {day.completed} of {day.total} habits completed
                          </p>
                        </div>
                        <div className="flex items-center">
                          <Progress value={(day.completed / day.total) * 100} className="h-2 w-24 mr-2" />
                          <span className="text-sm font-medium">{Math.round((day.completed / day.total) * 100)}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4">No history available yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Assigned Habits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {habits && habits.length > 0 ? (
                    habits.map(habit => (
                      <div key={habit.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{habit.name}</p>
                          <p className="text-sm text-muted-foreground">{habit.description}</p>
                        </div>
                        <div>
                          {habit.frequency && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {habit.frequency}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4">No habits assigned yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
    </PatientPageLayout>
  );
};

export default PatientHabitsPage;
