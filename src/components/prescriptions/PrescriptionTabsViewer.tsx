
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
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
    <Card className={cn(
      "p-4 bg-white/10 backdrop-blur-lg border-0 shadow-sm rounded-xl", 
      className
    )}>
      <Tabs defaultValue="medications" className="w-full">
        <TabsList className="grid grid-cols-4 w-full bg-white/20 backdrop-blur-md rounded-lg border-0 mb-4 p-1">
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

        <TabsContent value="medications" className="rounded-lg bg-white/5 backdrop-blur-sm p-4 border-0">
          <MedicationsTab patientId={patientId} />
        </TabsContent>
        
        <TabsContent value="diet" className="rounded-lg bg-white/5 backdrop-blur-sm p-4 border-0">
          <DietPlanTab patientId={patientId} />
        </TabsContent>
        
        <TabsContent value="exercise" className="rounded-lg bg-white/5 backdrop-blur-sm p-4 border-0">
          <ExerciseTab patientId={patientId} />
        </TabsContent>
        
        <TabsContent value="mental" className="rounded-lg bg-white/5 backdrop-blur-sm p-4 border-0">
          <MentalHealthTab patientId={patientId} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};
