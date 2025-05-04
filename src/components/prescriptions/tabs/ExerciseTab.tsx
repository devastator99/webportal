
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';
import { Dumbbell } from 'lucide-react';

interface ExerciseTabProps {
  patientId: string;
}

export const ExerciseTab = ({ patientId }: ExerciseTabProps) => {
  const { data: exercises, isLoading } = useQuery({
    queryKey: ['patient_exercises', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_plan_items')
        .select('*')
        .eq('patient_id', patientId)
        .eq('type', 'exercise')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center w-full p-6">
        <Spinner />
      </div>
    );
  }

  if (!exercises?.length) {
    return (
      <div className="text-center w-full p-6 text-muted-foreground">
        No exercise plans found.
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {exercises.map((exercise) => (
        <Card key={exercise.id} className="w-full bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">
                {exercise.description}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {exercise.scheduled_time} • {exercise.frequency}
              </p>
            </div>
          </CardHeader>
          {exercise.duration && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Duration: {exercise.duration}
              </p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
