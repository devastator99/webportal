
import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
      <div className="flex justify-center w-full py-10">
        <Spinner />
      </div>
    );
  }

  if (!dietPlans?.length) {
    return (
      <div className="text-center w-full py-10 text-muted-foreground">
        No diet plans found.
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-medium text-amber-700 mb-2">Nutrition Plan</h2>
      <p className="text-gray-500 mb-6">
        Recommended by Alex Thompson, Nutritionist on April 3, 2025
      </p>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Macronutrient Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="font-medium text-gray-600 mb-1">Carbs</p>
              <p className="text-2xl font-bold text-amber-700">20%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="font-medium text-gray-600 mb-1">Protein</p>
              <p className="text-2xl font-bold text-amber-700">40%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="font-medium text-gray-600 mb-1">Fats</p>
              <p className="text-2xl font-bold text-amber-700">40%</p>
            </div>
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
          <div className="bg-purple-50 p-4 rounded-lg mb-3">
            <p className="font-medium">Breakfast</p>
            <p>Eggs and avocado</p>
          </div>
        </div>
      </div>
    </div>
  );
};
