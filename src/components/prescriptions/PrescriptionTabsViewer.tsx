
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassCard } from '@/components/ui/card';
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
    <div className={cn("w-full max-w-full", className)}>
      <Tabs defaultValue="medications" className="w-full">
        <TabsList className="grid grid-cols-4 w-full mb-6 bg-white/20 backdrop-blur-md rounded-lg border-0 p-1">
          <TabsTrigger value="medications" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white/60">
            <Pill className="h-4 w-4" />
            <span className="hidden sm:inline">Medications</span>
            <span className="sm:hidden">Meds</span>
          </TabsTrigger>
          <TabsTrigger value="diet" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white/60">
            <Utensils className="h-4 w-4" />
            <span className="hidden sm:inline">Diet Plan</span>
            <span className="sm:hidden">Diet</span>
          </TabsTrigger>
          <TabsTrigger value="exercise" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white/60">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Exercise</span>
            <span className="sm:hidden">Exer</span>
          </TabsTrigger>
          <TabsTrigger value="mental" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white/60">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Mental Health</span>
            <span className="sm:hidden">Mental</span>
          </TabsTrigger>
        </TabsList>

        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border-0 w-full">
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
};
