
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';

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
      <div className="flex justify-center w-full p-6">
        <Spinner />
      </div>
    );
  }

  if (!dietPlans?.length) {
    return (
      <div className="text-center w-full p-6 text-muted-foreground">
        No diet plans found.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-amber-700">Nutrition Plan</h2>
        <p className="text-muted-foreground">
          Recommended by Alex Thompson, Nutritionist on April 3, 2025
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Macronutrient Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-purple-50">
              <CardContent className="p-4 text-center">
                <p className="font-medium text-gray-600">Carbs</p>
                <p className="text-2xl font-bold text-amber-700">20%</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50">
              <CardContent className="p-4 text-center">
                <p className="font-medium text-gray-600">Protein</p>
                <p className="text-2xl font-bold text-amber-700">40%</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50">
              <CardContent className="p-4 text-center">
                <p className="font-medium text-gray-600">Fats</p>
                <p className="text-2xl font-bold text-amber-700">40%</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Daily Guidelines</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Limit caffeine to before noon</li>
            <li>Aim for 2 liters of water daily</li>
            <li>Focus on whole foods, limit processed foods</li>
            <li>Include protein with each meal</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Sample Meal Plan</h3>
          <Card className="bg-purple-50 mb-3">
            <CardContent className="p-4">
              <p className="font-medium">Breakfast</p>
              <p>Eggs and avocado</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
