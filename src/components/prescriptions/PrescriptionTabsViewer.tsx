
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
    <Card className={cn("p-4 glass-card", className)}>
      <Tabs defaultValue="medications" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="medications" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="diet" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Diet Plan
          </TabsTrigger>
          <TabsTrigger value="exercise" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Exercise
          </TabsTrigger>
          <TabsTrigger value="mental" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Mental Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medications">
          <MedicationsTab patientId={patientId} />
        </TabsContent>
        
        <TabsContent value="diet">
          <DietPlanTab patientId={patientId} />
        </TabsContent>
        
        <TabsContent value="exercise">
          <ExerciseTab patientId={patientId} />
        </TabsContent>
        
        <TabsContent value="mental">
          <MentalHealthTab patientId={patientId} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};
