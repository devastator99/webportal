
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, UserRound, Pill, Utensils, Dumbbell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface HealthPlanItem {
  id: string;
  type: 'food' | 'exercise' | 'medication';
  scheduled_time: string;
  description: string;
  frequency: string;
  duration: string | null;
}

export const PatientHealthPlan = ({ patientId }: { patientId: string }) => {
  const [healthPlanItems, setHealthPlanItems] = useState<HealthPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHealthPlan = async () => {
      try {
        setIsLoading(true);
        // Use direct query instead of RPC to avoid TypeScript issues
        const { data, error } = await supabase
          .from('health_plan_items')
          .select('*')
          .eq('patient_id', patientId);

        if (error) {
          throw error;
        }
        
        setHealthPlanItems(data as HealthPlanItem[]);
      } catch (error: any) {
        console.error("Error fetching health plan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId) {
      fetchHealthPlan();
    }
  }, [patientId]);

  const renderIcon = (type: string) => {
    switch (type) {
      case 'food':
        return <Utensils className="h-5 w-5 text-green-500" />;
      case 'exercise':
        return <Dumbbell className="h-5 w-5 text-blue-500" />;
      case 'medication':
        return <Pill className="h-5 w-5 text-red-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (healthPlanItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Plan</CardTitle>
          <CardDescription>Patient's personalized health plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <UserRound className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              No health plan has been created for this patient yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group health plan items by type
  const groupedItems: Record<string, HealthPlanItem[]> = {
    food: [],
    exercise: [],
    medication: []
  };

  healthPlanItems.forEach(item => {
    if (groupedItems[item.type]) {
      groupedItems[item.type].push(item);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Plan</CardTitle>
        <CardDescription>Patient's personalized health plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedItems).map(([type, items]) => (
          items.length > 0 && (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                {renderIcon(type)}
                <h3 className="font-semibold capitalize">{type} Plan</h3>
              </div>
              <Separator />
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">{item.scheduled_time}</p>
                    </div>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <span>{item.frequency}</span>
                      {item.duration && <span>• Duration: {item.duration}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </CardContent>
    </Card>
  );
};
