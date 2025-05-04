
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
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
      <div className="flex justify-center w-full p-6">
        <Spinner />
      </div>
    );
  }

  if (!mentalHealthPlans?.length) {
    return (
      <div className="text-center w-full p-6 text-muted-foreground">
        No mental health recommendations found.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-amber-700">Mental Wellbeing Plan</h2>
        <p className="text-muted-foreground">
          From Dr. Lisa Patel, Psychologist on April 7, 2025
        </p>
      </div>

      <div className="space-y-6 w-full">
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
          <div className="grid gap-3 w-full sm:grid-cols-1 md:grid-cols-2">
            <Card className="bg-purple-50 w-full">
              <CardContent className="p-4">
                <p className="font-medium">Sleep Meditation</p>
                <p className="text-sm text-muted-foreground">Available in the Resources section</p>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 w-full">
              <CardContent className="p-4">
                <p className="font-medium">Stress Management Guide</p>
                <p className="text-sm text-muted-foreground">PDF available for download</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
