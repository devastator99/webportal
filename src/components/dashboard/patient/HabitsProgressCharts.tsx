
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Dumbbell, Utensils, Moon, Brain } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, BarChart, LineChart } from "@/components/ui/recharts";

// Mock data - would be replaced with real data from your database
const exerciseData = [
  { date: "Mon", value: 3 },
  { date: "Tue", value: 5 },
  { date: "Wed", value: 2 },
  { date: "Thu", value: 7 },
  { date: "Fri", value: 4 },
  { date: "Sat", value: 8 },
  { date: "Sun", value: 5 },
];

const nutritionData = [
  { date: "Mon", value: 7 },
  { date: "Tue", value: 6 },
  { date: "Wed", value: 8 },
  { date: "Thu", value: 7 },
  { date: "Fri", value: 5 },
  { date: "Sat", value: 6 },
  { date: "Sun", value: 8 },
];

const sleepData = [
  { date: "Mon", value: 6.5 },
  { date: "Tue", value: 7.2 },
  { date: "Wed", value: 8.0 },
  { date: "Thu", value: 7.5 },
  { date: "Fri", value: 6.8 },
  { date: "Sat", value: 8.5 },
  { date: "Sun", value: 9.0 },
];

const mindfulnessData = [
  { date: "Mon", value: 15 },
  { date: "Tue", value: 10 },
  { date: "Wed", value: 20 },
  { date: "Thu", value: 15 },
  { date: "Fri", value: 25 },
  { date: "Sat", value: 30 },
  { date: "Sun", value: 20 },
];

export const HabitsProgressCharts = () => {
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
                Your weekly exercise activity in hours
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
                valueFormatter={(value) => `${value} hrs`}
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
                valueFormatter={(value) => `${value} mins`}
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
            <div className="h-[200px] flex items-center justify-center text-center text-muted-foreground">
              <p>Weekly summary chart visualization here</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Your progress over the past month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-center text-muted-foreground">
              <p>Monthly trends chart visualization here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
