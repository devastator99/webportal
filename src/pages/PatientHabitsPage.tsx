
import { useEffect, useState } from "react";
import { PatientAppLayout } from "@/layouts/PatientAppLayout";
import { usePatientHabits } from "@/hooks/usePatientHabits";
import { Loader2 } from "lucide-react";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { HabitTracker } from "@/components/dashboard/patient/HabitTracker";
import { HabitsProgressCharts } from "@/components/dashboard/patient/HabitsProgressCharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ResponsiveText } from "@/components/ui/responsive-typography";

const PatientHabitsPage = () => {
  const { isLoading, refetchHealthPlanItems, healthPlanItems, progressLogs } = usePatientHabits();
  const [activeTab, setActiveTab] = useState("habits");
  
  useEffect(() => {
    refetchHealthPlanItems();
  }, [refetchHealthPlanItems]);

  // Calculate habit completion status
  const calculateCompletionStatus = () => {
    const today = new Date().toISOString().slice(0, 10);
    const completionStatus: Record<string, boolean> = {};
    
    if (progressLogs) {
      progressLogs.forEach(log => {
        if (log.date === today && log.value > 0 && log.habit_id) {
          completionStatus[log.habit_id] = true;
        }
      });
    }
    
    return completionStatus;
  };

  const habitCompletionStatus = calculateCompletionStatus();
  
  return (
    <PatientAppLayout>
      <ContentContainer>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#7E69AB]" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4 sm:mb-6 bg-white rounded-lg shadow-sm border border-[#9b87f5]/10">
              <TabsTrigger 
                value="habits" 
                className="text-base py-1 mb-5 data-[state=active]:bg-[#9b87f5]/20 data-[state=active]:text-[#7E69AB] font-medium rounded-md"
              >
                Habits
              </TabsTrigger>
              <TabsTrigger 
                value="progress" 
                className="text-base py-1 mb-5 data-[state=active]:bg-[#9b87f5]/20 data-[state=active]:text-[#7E69AB] font-medium rounded-md"
              >
                Progress
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="habits" className="w-full">
              <HabitTracker 
                habits={healthPlanItems || []} 
                onHabitAdded={refetchHealthPlanItems}
                habitCompletionStatus={habitCompletionStatus}
              />
            </TabsContent>
            
            <TabsContent value="progress">
              <Card className="p-4 sm:p-6 shadow-sm border border-[#9b87f5]/10 bg-white rounded-lg">
                <HabitsProgressCharts />
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </ContentContainer>
    </PatientAppLayout>
  );
};

export default PatientHabitsPage;
