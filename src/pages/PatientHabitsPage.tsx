import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { HabitsProgressCharts } from "@/components/dashboard/patient/HabitsProgressCharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Dumbbell, Utensils, Moon, Brain, Pill, Plus } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { AddHabitDialog } from '@/components/dashboard/patient/AddHabitDialog';
import { useAuth } from '@/contexts/AuthContext';

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
    refetchHealthPlanItems
  } = usePatientHabits();

  const { user } = useAuth();
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const { isTablet, isMobile } = useResponsive();
  const { padding, margin, gapSize } = useResponsiveLayout();
  
  const [addHabitDialogOpen, setAddHabitDialogOpen] = useState(false);

  // Separate health plan items between patient-created and nutritionist-created
  // based on whether nutritionist_id matches patient_id
  const nutritionistItems = {};
  const patientItems = {};
  
  healthPlanItems?.forEach(item => {
    if (item.nutritionist_id === user?.id) {
      // If nutritionist_id is the same as the user's id, it was created by the patient
      if (!patientItems[item.type]) {
        patientItems[item.type] = [];
      }
      patientItems[item.type].push(item);
    } else {
      // Otherwise it was created by a nutritionist or doctor
      if (!nutritionistItems[item.type]) {
        nutritionistItems[item.type] = [];
      }
      nutritionistItems[item.type].push(item);
    }
  });

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
    <div className="flex flex-col min-h-screen">
      <PatientHeader />
      
      <div className={`px-${isSmallScreen || isMobile ? '3' : isTablet || isMediumScreen ? '4' : '6'} pb-16 flex-1 overflow-y-auto`}>
        <div className="flex justify-between items-center mt-2 mb-4">
          <ResponsiveText
            as="h1"
            className="mt-2"
            mobileSize="xl"
            tabletSize="2xl"
            desktopSize="2xl"
            weight="bold"
          >
            My Health Plan
          </ResponsiveText>
          
          <Button 
            variant="default" 
            size={isSmallScreen || isMobile ? "sm" : "default"} 
            onClick={() => setAddHabitDialogOpen(true)}
            className="bg-[#9b87f5] hover:bg-[#8a74e8]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Habit
          </Button>
        </div>
        
        <p className={`text-muted-foreground mb-${isSmallScreen || isMobile ? '3' : '5'} text-sm sm:text-base`}>
          Track your habits and follow your personalized health plan
        </p>

        <Tabs defaultValue="overview" className={`mb-${isSmallScreen || isMobile ? '4' : '6'}`}>
          <TabsList className={`mb-4 ${isSmallScreen || isMobile ? 'w-full' : ''}`}>
            <TabsTrigger value="overview" className={isSmallScreen || isMobile ? 'text-xs py-1.5' : ''}>Overview</TabsTrigger>
            <TabsTrigger value="progress" className={isSmallScreen || isMobile ? 'text-xs py-1.5' : ''}>Progress</TabsTrigger>
            <TabsTrigger value="plan" className={isSmallScreen || isMobile ? 'text-xs py-1.5' : ''}>Recommended Plan</TabsTrigger>
            <TabsTrigger value="my-habits" className={isSmallScreen || isMobile ? 'text-xs py-1.5' : ''}>My Habits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="min-h-[60vh]">
            <div className={`grid gap-${isSmallScreen || isMobile ? '3' : isTablet || isMediumScreen ? '4' : '6'} ${isSmallScreen || isMobile ? 'grid-cols-1' : isTablet || isMediumScreen ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2'}`}>
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
          
          <TabsContent value="progress" className="min-h-[60vh]">
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
          
          <TabsContent value="plan" id="plan-section" className="min-h-[60vh]">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  Recommended Health Plan
                </CardTitle>
                <CardDescription>
                  Personalized recommendations from your care team
                </CardDescription>
              </CardHeader>
            </Card>
            
            <DetailedHealthPlan
              groupedItems={nutritionistItems}
              typeIcons={typeIcons}
              onSetupReminder={setupReminder}
              onMarkComplete={(item) => {
                setSelectedItem(item);
                setNewLogValue(0);
                setNewLogNotes("");
                setCompletionDialogOpen(true);
              }}
              emptyMessage="No recommendations from your care team yet."
            />
          </TabsContent>
          
          <TabsContent value="my-habits" id="my-habits-section" className="min-h-[60vh]">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#9b87f5]" />
                  My Personal Habits
                </CardTitle>
                <CardDescription>
                  Habits you've created to track your personal health goals
                </CardDescription>
              </CardHeader>
            </Card>
            
            <DetailedHealthPlan
              groupedItems={patientItems}
              typeIcons={typeIcons}
              onSetupReminder={setupReminder}
              onMarkComplete={(item) => {
                setSelectedItem(item);
                setNewLogValue(0);
                setNewLogNotes("");
                setCompletionDialogOpen(true);
              }}
              emptyMessage="You haven't added any personal habits yet. Click the 'Add Habit' button to get started."
              isPatientCreated={true}
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
        
        {/* Add Habit Dialog */}
        <AddHabitDialog
          open={addHabitDialogOpen}
          onOpenChange={setAddHabitDialogOpen}
          onHabitAdded={refetchHealthPlanItems}
        />
      </div>
    </div>
  );
};

export default PatientHabitsPage;
