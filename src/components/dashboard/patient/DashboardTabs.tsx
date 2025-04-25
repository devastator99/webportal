
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pill, Apple, Activity, Brain } from "lucide-react";
import { MedicationsTab } from './tabs/MedicationsTab';
import { DietPlanTab } from './tabs/DietPlanTab';
import { ExerciseTab } from './tabs/ExerciseTab';
import { MentalHealthTab } from './tabs/MentalHealthTab';
import { cn } from '@/lib/utils';

export const DashboardTabs = () => {
  return (
    <Tabs defaultValue="medications" className="w-full">
      <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 bg-transparent h-auto p-2">
        <TabsTrigger 
          value="medications"
          className={cn(
            "flex items-center gap-2 p-3 data-[state=active]:bg-[#E5DEFF] data-[state=active]:text-[#9b87f5]",
            "hover:bg-[#E5DEFF]/50 transition-colors",
            "border rounded-lg"
          )}
        >
          <Pill className="h-5 w-5" />
          <span className="hidden md:inline">Medications</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="diet"
          className={cn(
            "flex items-center gap-2 p-3 data-[state=active]:bg-[#E5DEFF] data-[state=active]:text-[#9b87f5]",
            "hover:bg-[#E5DEFF]/50 transition-colors",
            "border rounded-lg"
          )}
        >
          <Apple className="h-5 w-5" />
          <span className="hidden md:inline">Diet Plan</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="exercise"
          className={cn(
            "flex items-center gap-2 p-3 data-[state=active]:bg-[#E5DEFF] data-[state=active]:text-[#9b87f5]",
            "hover:bg-[#E5DEFF]/50 transition-colors",
            "border rounded-lg"
          )}
        >
          <Activity className="h-5 w-5" />
          <span className="hidden md:inline">Exercise</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="mental"
          className={cn(
            "flex items-center gap-2 p-3 data-[state=active]:bg-[#E5DEFF] data-[state=active]:text-[#9b87f5]",
            "hover:bg-[#E5DEFF]/50 transition-colors",
            "border rounded-lg"
          )}
        >
          <Brain className="h-5 w-5" />
          <span className="hidden md:inline">Mental Health</span>
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="medications" className="m-0">
          <MedicationsTab />
        </TabsContent>

        <TabsContent value="diet" className="m-0">
          <DietPlanTab />
        </TabsContent>

        <TabsContent value="exercise" className="m-0">
          <ExerciseTab />
        </TabsContent>

        <TabsContent value="mental" className="m-0">
          <MentalHealthTab />
        </TabsContent>
      </div>
    </Tabs>
  );
};
