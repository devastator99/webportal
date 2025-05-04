
import { useEffect } from "react";
import { PatientAppLayout } from "@/layouts/PatientAppLayout";
import { DailyHabits } from "@/components/habits/DailyHabits";
import { HabitCalendar } from "@/components/habits/HabitCalendar";
import { HabitHistoryChart } from "@/components/habits/HabitHistoryChart";
import { HabitsPieChart } from "@/components/habits/HabitsPieChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientHabits } from "@/hooks/usePatientHabits";

const PatientHabitsPage = () => {
  const { habits, isLoading, fetchHabits, summaryData } = usePatientHabits();
  
  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);
  
  return (
    <PatientAppLayout showHeader title="Health Habits" description="Track your daily health activities and see your progress">
      <div className="space-y-6">
        <DailyHabits />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <HabitCalendar />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Habits Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <HabitsPieChart />
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <HabitHistoryChart />
          </CardContent>
        </Card>
      </div>
    </PatientAppLayout>
  );
};

export default PatientHabitsPage;
