
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';

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
      <div className="flex justify-center w-full py-10">
        <Spinner />
      </div>
    );
  }

  if (!exercises?.length) {
    return (
      <div className="text-center w-full py-10 text-muted-foreground">
        No exercise plans found.
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-medium text-amber-700 mb-2">Exercise Regimen</h2>
      <p className="text-gray-500 mb-6">
        Designed by Michael Johnson, Physical Therapist on March 30, 2025
      </p>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Weekly Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-100 rounded-lg p-4 shadow-sm">
              <p className="font-medium">Monday, Wednesday, Friday</p>
              <p className="text-gray-500">20 minutes walking, 10 minutes stretching</p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4 shadow-sm">
              <p className="font-medium">Tuesday, Thursday</p>
              <p className="text-gray-500">Light strength training with resistance bands</p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4 shadow-sm">
              <p className="font-medium">Weekend</p>
              <p className="text-gray-500">30 minutes leisure activity (swimming, hiking, etc.)</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Notes</h3>
          <p className="text-gray-500">
            Start slowly and build up intensity. Focus on proper form rather than duration. 
            Stay hydrated during exercise.
          </p>
        </div>
      </div>
    </div>
  );
};
