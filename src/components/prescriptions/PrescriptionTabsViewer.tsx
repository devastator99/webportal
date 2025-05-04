
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill, Utensils, Dumbbell, Brain } from 'lucide-react';
import { MedicationsTab } from './tabs/MedicationsTab';
import { DietPlanTab } from './tabs/DietPlanTab';
import { ExerciseTab } from './tabs/ExerciseTab';
import { MentalHealthTab } from './tabs/MentalHealthTab';
import { cn } from '@/lib/utils';

interface PrescriptionTabsViewerProps {
  patientId: string;
  className?: string;
}

export const PrescriptionTabsViewer = ({ patientId, className }: PrescriptionTabsViewerProps) => {
  return (
    <div className={cn("w-full", className)}>
      <h1 className="text-2xl font-semibold mb-6 text-amber-700">Your Prescriptions</h1>
      <Tabs defaultValue="medications" className="w-full">
        <TabsList className="grid grid-cols-4 w-full mb-6 bg-gray-50 shadow-sm border-0 rounded-lg overflow-hidden">
          <TabsTrigger 
            value="medications" 
            className="flex items-center gap-2 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-700 data-[state=active]:bg-white"
          >
            <Pill className="h-5 w-5 text-amber-700" />
            <span className="hidden sm:inline text-sm font-medium">Medications</span>
            <span className="sm:hidden text-sm font-medium">Meds</span>
          </TabsTrigger>
          <TabsTrigger 
            value="diet" 
            className="flex items-center gap-2 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-700 data-[state=active]:bg-white"
          >
            <Utensils className="h-5 w-5 text-amber-700" />
            <span className="hidden sm:inline text-sm font-medium">Diet Plan</span>
            <span className="sm:hidden text-sm font-medium">Diet</span>
          </TabsTrigger>
          <TabsTrigger 
            value="exercise" 
            className="flex items-center gap-2 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-700 data-[state=active]:bg-white"
          >
            <Dumbbell className="h-5 w-5 text-amber-700" />
            <span className="hidden sm:inline text-sm font-medium">Exercise</span>
            <span className="sm:hidden text-sm font-medium">Exer</span>
          </TabsTrigger>
          <TabsTrigger 
            value="mental" 
            className="flex items-center gap-2 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-700 data-[state=active]:bg-white"
          >
            <Brain className="h-5 w-5 text-amber-700" />
            <span className="hidden sm:inline text-sm font-medium">Mental Health</span>
            <span className="sm:hidden text-sm font-medium">Mental</span>
          </TabsTrigger>
        </TabsList>

        <div className="w-full bg-white rounded-xl p-6 shadow-sm">
          <TabsContent value="medications" className="mt-0 w-full">
            <MedicationsTab patientId={patientId} />
          </TabsContent>
          
          <TabsContent value="diet" className="mt-0 w-full">
            <DietPlanTab patientId={patientId} />
          </TabsContent>
          
          <TabsContent value="exercise" className="mt-0 w-full">
            <ExerciseTab patientId={patientId} />
          </TabsContent>
          
          <TabsContent value="mental" className="mt-0 w-full">
            <MentalHealthTab patientId={patientId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
