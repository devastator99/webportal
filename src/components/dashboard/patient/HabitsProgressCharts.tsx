
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Dumbbell, Utensils, Moon, Brain } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, BarChart, LineChart } from "@/components/ui/recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { dateHelpers, dateFormatters } from "@/utils/date-helpers";
import { Spinner } from "@/components/ui/spinner";

// Define interface for habit logs
interface HabitLog {
  id: string;
  habit_id: string | null;
  habit_type: string;
  value: number;
  date: string;
  notes: string | null;
  created_at: string;
}

// Function to format data for charts by date
const formatDataByDate = (logs: HabitLog[] | undefined, habitType: string) => {
  if (!logs || logs.length === 0) {
    return dateHelpers.getLast7Days().map(date => ({
      date: dateFormatters.shortDayOfWeek(date),
      value: 0
    }));
  }

  // Filter logs by habit type
  const filteredLogs = logs.filter(log => log.habit_type === habitType);
  
  // Get last 7 days as date objects
  const last7Days = dateHelpers.getLast7Days();
  
  // Create a map of date strings to values
  const dateValueMap: Record<string, number> = {};
  filteredLogs.forEach(log => {
    const dateStr = new Date(log.date).toISOString().split('T')[0];
    if (dateValueMap[dateStr]) {
      // If we already have an entry for this date, use the higher value
      dateValueMap[dateStr] = Math.max(dateValueMap[dateStr], log.value);
    } else {
      dateValueMap[dateStr] = log.value;
    }
  });
  
  // Map the dates to the format needed for charts
  return last7Days.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    return {
      date: dateFormatters.shortDayOfWeek(date),
      value: dateValueMap[dateStr] || 0
    };
  });
};

export const HabitsProgressCharts = () => {
  const { user } = useAuth();
  
  // Fetch habit logs
  const { data: habitLogs, isLoading } = useQuery({
    queryKey: ["habit_logs", user?.id],
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
      
      return data as HabitLog[];
    },
    enabled: !!user?.id
  });

  // Create chart data for each habit type
  const exerciseData = formatDataByDate(habitLogs, 'physical');
  const nutritionData = formatDataByDate(habitLogs, 'nutrition');
  const sleepData = formatDataByDate(habitLogs, 'sleep');
  const mindfulnessData = formatDataByDate(habitLogs, 'mindfulness');

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // If we don't have any real data, create placeholders
  if (!habitLogs || habitLogs.length === 0) {
    // This section will be shown if no habit logs exist yet
    console.log("No habit logs found, using placeholder data");
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="physical">
        <TabsList className="grid grid-cols-4 md:w-[600px] mb-4">
          <TabsTrigger value="physical" className="flex gap-1 items-center">
            <Dumbbell className="h-4 w-4" /> Physical
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex gap-1 items-center">
            <Utensils className="h-4 w-4" /> Nutrition
          </TabsTrigger>
          <TabsTrigger value="sleep" className="flex gap-1 items-center">
            <Moon className="h-4 w-4" /> Sleep
          </TabsTrigger>
          <TabsTrigger value="mindfulness" className="flex gap-1 items-center">
            <Brain className="h-4 w-4" /> Mindfulness
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="physical">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-blue-500" />
                Physical Activity
              </CardTitle>
              <CardDescription>
                Your weekly exercise activity in minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart 
                data={exerciseData}
                index="date"
                categories={["value"]}
                colors={["blue"]}
                yAxisWidth={40}
                showAnimation={true}
                showLegend={false}
                className="h-[300px]"
                valueFormatter={(value) => `${value} min`}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="nutrition">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-green-500" />
                Nutrition
              </CardTitle>
              <CardDescription>
                Your healthy eating score (1-10 scale)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart 
                data={nutritionData}
                index="date"
                categories={["value"]}
                colors={["green"]}
                yAxisWidth={40}
                showAnimation={true}
                showLegend={false}
                className="h-[300px]"
                valueFormatter={(value) => `${value}/10`}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sleep">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-indigo-500" />
                Sleep
              </CardTitle>
              <CardDescription>
                Your sleep duration in hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AreaChart 
                data={sleepData}
                index="date"
                categories={["value"]}
                colors={["indigo"]}
                yAxisWidth={40}
                showAnimation={true}
                showLegend={false}
                className="h-[300px]"
                valueFormatter={(value) => `${value} hrs`}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mindfulness">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Mindfulness
              </CardTitle>
              <CardDescription>
                Minutes spent on mindfulness activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart 
                data={mindfulnessData}
                index="date"
                categories={["value"]}
                colors={["purple"]}
                yAxisWidth={40}
                showAnimation={true}
                showLegend={false}
                className="h-[300px]"
                valueFormatter={(value) => `${value} min`}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
            <CardDescription>Your progress for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Physical Activity</p>
                    <p className="text-2xl font-bold">
                      {exerciseData.reduce((sum, day) => sum + day.value, 0)} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Nutrition</p>
                    <p className="text-2xl font-bold">
                      {(nutritionData.reduce((sum, day) => sum + day.value, 0) / 7).toFixed(1)}/10
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium">Sleep</p>
                    <p className="text-2xl font-bold">
                      {(sleepData.reduce((sum, day) => sum + day.value, 0) / 7).toFixed(1)} hrs/day
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Mindfulness</p>
                    <p className="text-2xl font-bold">
                      {mindfulnessData.reduce((sum, day) => sum + day.value, 0)} min
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Progress Tips</CardTitle>
            <CardDescription>Insights for better health habits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h3 className="font-medium flex items-center gap-1">
                  <Dumbbell className="h-4 w-4 text-blue-500" />
                  Physical Activity
                </h3>
                <p className="text-sm text-muted-foreground">
                  Try to get at least 30 minutes of moderate activity daily.
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h3 className="font-medium flex items-center gap-1">
                  <Utensils className="h-4 w-4 text-green-500" />
                  Nutrition
                </h3>
                <p className="text-sm text-muted-foreground">
                  Include more leafy greens and reduce processed foods.
                </p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <h3 className="font-medium flex items-center gap-1">
                  <Moon className="h-4 w-4 text-indigo-500" />
                  Sleep
                </h3>
                <p className="text-sm text-muted-foreground">
                  Aim for 7-8 hours of quality sleep each night.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
