
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';
import { Utensils } from 'lucide-react';

interface DietPlanTabProps {
  patientId: string;
}

export const DietPlanTab = ({ patientId }: DietPlanTabProps) => {
  const { data: dietPlans, isLoading } = useQuery({
    queryKey: ['patient_diet_plans', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_plan_items')
        .select('*')
        .eq('patient_id', patientId)
        .eq('type', 'food')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Spinner />
      </div>
    );
  }

  if (!dietPlans?.length) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        No diet plans found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dietPlans.map((plan) => (
        <Card key={plan.id} className="bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <Utensils className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">
                {plan.description}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {plan.scheduled_time} • {plan.frequency}
              </p>
            </div>
          </CardHeader>
          {plan.duration && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Duration: {plan.duration}
              </p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
