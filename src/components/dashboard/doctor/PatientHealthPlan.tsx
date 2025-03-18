
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Calendar, Activity, Pizza, Pill } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HealthPlanItem {
  id: string;
  type: 'food' | 'exercise' | 'medication';
  scheduled_time: string;
  description: string;
  frequency: string;
  duration: string | null;
}

interface PatientHealthPlanProps {
  patientId: string;
}

export const PatientHealthPlan = ({ patientId }: PatientHealthPlanProps) => {
  const [healthPlanItems, setHealthPlanItems] = useState<HealthPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHealthPlan = async () => {
      if (!patientId) return;
      
      try {
        setIsLoading(true);
        
        // Use RPC function to get health plan
        const { data, error } = await supabase.rpc(
          'get_patient_health_plan',
          { p_patient_id: patientId }
        );
        
        if (error) {
          throw error;
        }
        
        setHealthPlanItems(data || []);
      } catch (error: any) {
        console.error("Error fetching health plan:", error);
        toast({
          title: "Error",
          description: `Failed to load health plan: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthPlan();
  }, [patientId, toast]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'food':
        return <Pizza className="h-5 w-5 text-green-500" />;
      case 'exercise':
        return <Activity className="h-5 w-5 text-blue-500" />;
      case 'medication':
        return <Pill className="h-5 w-5 text-red-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'food':
        return 'bg-green-100 border-green-200';
      case 'exercise':
        return 'bg-blue-100 border-blue-200';
      case 'medication':
        return 'bg-red-100 border-red-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Patient Health Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : healthPlanItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No health plan has been created for this patient yet.
          </p>
        ) : (
          <div className="space-y-4">
            {healthPlanItems.map((item) => (
              <div 
                key={item.id} 
                className={`p-4 rounded-md border ${getTypeColor(item.type)} flex`}
              >
                <div className="mr-3 mt-1">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium capitalize">{item.type}</h4>
                    <span className="text-sm text-gray-500">{item.scheduled_time}</span>
                  </div>
                  <p className="mt-1">{item.description}</p>
                  <div className="mt-2 flex gap-x-4 text-sm text-gray-600">
                    <span>Frequency: {item.frequency}</span>
                    {item.duration && <span>Duration: {item.duration}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
