
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { HealthPlanCreator } from './HealthPlanCreator';
import { HealthPlanItemsGrid } from './HealthPlanItemsGrid';
import { HealthPlanPDF } from './HealthPlanPDF';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Grid3X3, PlusCircle, ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface NutritionistHealthPlanTabsProps {
  patientId: string;
  onClose: () => void;
}

export const NutritionistHealthPlanTabs = ({ patientId, onClose }: NutritionistHealthPlanTabsProps) => {
  const [activeTab, setActiveTab] = useState('items');

  // Fetch patient details for header
  const { data: patientDetails, isLoading: isLoadingPatient } = useQuery({
    queryKey: ['patient_details', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', patientId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Check if this patient has any health plan items
  const { data: healthPlanCount, isLoading: isCheckingPlan } = useQuery({
    queryKey: ['health_plan_count', patientId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('health_plan_items')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId);
      
      if (error) throw error;
      return count || 0;
    }
  });

  const isLoading = isLoadingPatient || isCheckingPlan;
  const patientName = patientDetails 
    ? `${patientDetails.first_name || ''} ${patientDetails.last_name || ''}`.trim() 
    : 'Patient';

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onClose} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {isLoading ? 'Loading...' : `Health Plan for ${patientName}`}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="items">
                <Grid3X3 className="h-4 w-4 mr-2" />
                Plan Items
              </TabsTrigger>
              <TabsTrigger value="create">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create
              </TabsTrigger>
              <TabsTrigger value="pdf">
                <FileText className="h-4 w-4 mr-2" />
                PDF View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="items" className="mt-0">
              <HealthPlanItemsGrid patientId={patientId} />
            </TabsContent>
            
            <TabsContent value="create" className="mt-0">
              <HealthPlanCreator patientId={patientId} />
            </TabsContent>
            
            <TabsContent value="pdf" className="mt-0">
              <HealthPlanPDF patientId={patientId} onClose={() => setActiveTab('items')} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
