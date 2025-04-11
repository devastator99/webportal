
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { HabitsProgressCharts } from "@/components/dashboard/patient/HabitsProgressCharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Dumbbell, Utensils, Moon, Brain, Pill } from 'lucide-react';
import { usePatientHabits } from '@/hooks/usePatientHabits';
import { HealthPlanSummary } from '@/components/dashboard/patient/HealthPlanSummary';
import { ProgressSummary } from '@/components/dashboard/patient/ProgressSummary';
import { DetailedHealthPlan } from '@/components/dashboard/patient/DetailedHealthPlan';
import { ReminderDialog } from '@/components/dashboard/patient/ReminderDialog';
import { CompletionDialog } from '@/components/dashboard/patient/CompletionDialog';
import { useIsIPad, useIsMobile } from "@/hooks/use-mobile";

const typeIcons = {
  food: <Utensils className="h-5 w-5 text-green-500" />,
  exercise: <Dumbbell className="h-5 w-5 text-blue-500" />,
  meditation: <Brain className="h-5 w-5 text-purple-500" />,
  sleep: <Moon className="h-5 w-5 text-indigo-500" />,
  medication: <Pill className="h-5 w-5 text-red-500" />
};

const PatientHabitsPage = () => {
  const {
    healthPlanItems,
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
    completionDialogOpen,
    setCompletionDialogOpen,
    newLogValue,
    setNewLogValue,
    newLogNotes,
    setNewLogNotes,
    setupReminder,
    saveReminder,
    markAsCompleted,
  } = usePatientHabits();

  const isIPad = useIsIPad();
  const isMobile = useIsMobile();

  // Updated container class with improved padding to fix the thin line
  const containerClass = isMobile 
    ? "container mx-auto pt-0 pb-8 px-2" 
    : isIPad 
      ? "container mx-auto pt-0 pb-8 px-4" 
      : "container mx-auto pt-0 pb-8";

  // Improved content container with better spacing
  const contentContainerClass = "mt-16";

  if (isLoading) {
    return (
      <div className={containerClass}>
        <div className={`${contentContainerClass} flex items-center justify-center min-h-[70vh]`}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (planError) {
    return (
      <div className={containerClass}>
        <div className={contentContainerClass}>
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
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className={contentContainerClass}>
        <h1 className="text-2xl font-bold mb-2">My Health Plan</h1>
        <p className="text-muted-foreground mb-6">
          Track your habits and follow your personalized health plan
        </p>

        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className={`mb-4 ${isMobile ? 'w-full flex' : ''}`}>
            <TabsTrigger value="overview" className={isMobile ? 'flex-1' : ''}>Overview</TabsTrigger>
            <TabsTrigger value="progress" className={isMobile ? 'flex-1' : ''}>Progress</TabsTrigger>
            <TabsTrigger value="plan" className={isMobile ? 'flex-1' : ''}>Full Plan</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="animate-fade-up">
            <div className="grid gap-6 md:grid-cols-2">
              <HealthPlanSummary 
                healthPlanItems={healthPlanItems}
                onSetupReminder={setupReminder}
                onMarkComplete={(item) => {
                  setSelectedItem(item);
                  setNewLogValue(0);
                  setNewLogNotes("");
                  setCompletionDialogOpen(true);
                }}
              />
              
              <ProgressSummary
                summaryData={summaryData}
                percentages={percentages}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="progress" className="animate-fade-up">
            <Card>
              <CardHeader>
                <CardTitle>Progress Charts</CardTitle>
                <CardDescription>Visual representation of your health habits</CardDescription>
              </CardHeader>
              <CardContent className={isIPad || isMobile ? 'px-1 py-2' : ''}>
                <HabitsProgressCharts />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="plan" id="plan-section" className="animate-fade-up">
            <DetailedHealthPlan
              groupedItems={groupedItems}
              typeIcons={typeIcons}
              onSetupReminder={setupReminder}
              onMarkComplete={(item) => {
                setSelectedItem(item);
                setNewLogValue(0);
                setNewLogNotes("");
                setCompletionDialogOpen(true);
              }}
            />
          </TabsContent>
        </Tabs>
        
        {/* Set Reminder Dialog */}
        <ReminderDialog
          open={reminderDialogOpen}
          onOpenChange={setReminderDialogOpen}
          selectedReminder={selectedReminder}
          onSaveReminder={saveReminder}
          typeIcons={typeIcons}
        />
        
        {/* Mark as Complete Dialog */}
        <CompletionDialog
          open={completionDialogOpen}
          onOpenChange={setCompletionDialogOpen}
          selectedItem={selectedItem}
          newLogValue={newLogValue}
          setNewLogValue={setNewLogValue}
          newLogNotes={newLogNotes}
          setNewLogNotes={setNewLogNotes}
          onMarkAsCompleted={markAsCompleted}
          typeIcons={typeIcons}
        />
      </div>
    </div>
  );
};

export default PatientHabitsPage;
