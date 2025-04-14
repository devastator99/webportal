
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
import { useBreakpoint, useResponsiveLayout } from '@/hooks/use-responsive';
import { ResponsiveText } from '@/components/ui/responsive-typography';
import { useResponsive } from '@/contexts/ResponsiveContext';
import { PatientHeader } from '@/components/dashboard/patient/PatientHeader';

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

  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const { isTablet, isMobile } = useResponsive();
  const { padding, margin, gapSize } = useResponsiveLayout();

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (planError) {
    return (
      <div className="px-4 pt-6 pb-4">
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

  return (
    <div className="flex flex-col h-full">
      <PatientHeader />
      
      <div className={`px-${isSmallScreen || isMobile ? '3' : isTablet || isMediumScreen ? '4' : '6'} pb-16 flex-1`}>
        <ResponsiveText
          as="h1"
          className="mb-2"
          mobileSize="xl"
          tabletSize="2xl"
          desktopSize="2xl"
          weight="bold"
        >
          My Health Plan
        </ResponsiveText>
        
        <p className={`text-muted-foreground mb-${isSmallScreen || isMobile ? '3' : '5'} text-sm sm:text-base`}>
          Track your habits and follow your personalized health plan
        </p>

        <Tabs defaultValue="overview" className={`mb-${isSmallScreen || isMobile ? '4' : '6'}`}>
          <TabsList className={`mb-4 ${isSmallScreen || isMobile ? 'w-full' : ''}`}>
            <TabsTrigger value="overview" className={isSmallScreen || isMobile ? 'text-xs' : ''}>Overview</TabsTrigger>
            <TabsTrigger value="progress" className={isSmallScreen || isMobile ? 'text-xs' : ''}>Progress</TabsTrigger>
            <TabsTrigger value="plan" className={isSmallScreen || isMobile ? 'text-xs' : ''}>Full Plan</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className={`grid gap-${isSmallScreen || isMobile ? '3' : isTablet || isMediumScreen ? '4' : '6'} ${isSmallScreen || isMobile ? 'grid-cols-1' : isTablet || isMediumScreen ? 'grid-cols-1 md:grid-cols-2' : 'md:grid-cols-2'}`}>
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
          
          <TabsContent value="progress">
            <Card>
              <CardHeader className={isSmallScreen || isMobile ? 'p-3' : ''}>
                <CardTitle className={isSmallScreen || isMobile ? 'text-lg' : ''}>Progress Charts</CardTitle>
                <CardDescription>Visual representation of your health habits</CardDescription>
              </CardHeader>
              <CardContent className={isSmallScreen || isMobile ? 'p-3 pt-0' : ''}>
                <HabitsProgressCharts />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="plan" id="plan-section">
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
