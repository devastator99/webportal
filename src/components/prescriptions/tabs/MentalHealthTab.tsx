
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';

interface MentalHealthTabProps {
  patientId: string;
}

export const MentalHealthTab = ({ patientId }: MentalHealthTabProps) => {
  const { data: mentalHealthPlans, isLoading } = useQuery({
    queryKey: ['patient_mental_health', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_plan_items')
        .select('*')
        .eq('patient_id', patientId)
        .eq('type', 'mental_health')
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

  if (!mentalHealthPlans?.length) {
    return (
      <div className="text-center w-full py-10 text-muted-foreground">
        No mental health recommendations found.
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-medium text-amber-700 mb-2">Mental Wellbeing Plan</h2>
      <p className="text-gray-500 mb-6">
        From Dr. Lisa Patel, Psychologist on April 7, 2025
      </p>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Daily Practices</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>10 minutes morning meditation</li>
            <li>Gratitude journaling before bed</li>
            <li>Deep breathing exercises when feeling stressed</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Recommended Resources</h3>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="font-medium">Sleep Meditation</p>
              <p className="text-sm text-gray-500">Available in the Resources section</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="font-medium">Stress Management Guide</p>
              <p className="text-sm text-gray-500">PDF available for download</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
