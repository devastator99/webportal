
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
import { useResponsive } from '@/contexts/ResponsiveContext';
import { useResponsiveValue, useResponsiveButtonSize } from '@/hooks/use-responsive';

interface NutritionistHealthPlanTabsProps {
  patientId: string;
  onClose: () => void;
}

export const NutritionistHealthPlanTabs = ({ patientId, onClose }: NutritionistHealthPlanTabsProps) => {
  const [activeTab, setActiveTab] = useState('items');
  const { isMobile, isTablet } = useResponsive();
  
  // Responsive class adaptations
  const iconSize = useResponsiveValue({
    mobile: 'h-3.5 w-3.5',
    tablet: 'h-4 w-4',
    default: 'h-4 w-4'
  });
  
  const buttonSize = useResponsiveButtonSize({
    mobile: 'sm',
    default: 'default'
  });
  
  const headerPadding = useResponsiveValue({
    mobile: 'py-3 px-4',
    tablet: 'py-4 px-5',
    default: 'py-5 px-6'
  });

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
      <CardHeader className={`flex flex-row items-center justify-between ${headerPadding}`}>
        <CardTitle className={`flex items-center ${isMobile ? 'text-base' : ''}`}>
          <Button variant="ghost" size={buttonSize} onClick={onClose} className="mr-2">
            <ArrowLeft className={iconSize} />
          </Button>
          {isLoading ? 'Loading...' : `Health Plan for ${patientName}`}
        </CardTitle>
      </CardHeader>
      
      <CardContent className={isMobile ? 'p-3' : 'p-4'}>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid grid-cols-3 mb-4 ${isMobile ? 'h-10' : ''}`}>
              <TabsTrigger value="items" className={isMobile ? 'px-2 py-1.5 text-xs' : ''}>
                <Grid3X3 className={`${iconSize} ${isMobile ? 'mr-1' : 'mr-2'}`} />
                {isMobile ? 'Items' : 'Plan Items'}
              </TabsTrigger>
              <TabsTrigger value="create" className={isMobile ? 'px-2 py-1.5 text-xs' : ''}>
                <PlusCircle className={`${iconSize} ${isMobile ? 'mr-1' : 'mr-2'}`} />
                Create
              </TabsTrigger>
              <TabsTrigger value="pdf" className={isMobile ? 'px-2 py-1.5 text-xs' : ''}>
                <FileText className={`${iconSize} ${isMobile ? 'mr-1' : 'mr-2'}`} />
                {isMobile ? 'PDF' : 'PDF View'}
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
