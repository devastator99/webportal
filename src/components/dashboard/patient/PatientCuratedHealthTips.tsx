
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface HealthTip {
  id: string;
  title: string;
  content: string;
  category: string;
}

export const PatientCuratedHealthTips = () => {
  const { user } = useAuth();

  const { data: healthTips, isLoading } = useQuery<HealthTip[]>({
    queryKey: ['patient-health-tips', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        // Fetch patient's health data to curate tips
        const { data: patientData, error: profileError } = await supabase
          .rpc('get_patient_health_profile', { p_patient_id: user.id });

        if (profileError) {
          console.error("Error fetching patient health profile:", profileError);
          return [];
        }

        // Call AI function to generate personalized health tips
        const { data: aiTips, error: aiError } = await supabase.functions.invoke('generate-personalized-health-tips', {
          body: {
            patientId: user.id,
            healthProfile: patientData
          }
        });

        if (aiError) {
          console.error("Error generating health tips:", aiError);
          return [];
        }

        return aiError ? [] : aiTips.slice(0, 3);
      } catch (error) {
        console.error("Unexpected error in health tips:", error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  if (isLoading || !healthTips || healthTips.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Personalized Health Tips
        </CardTitle>
        <CardDescription>
          AI-powered suggestions tailored to your health profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {healthTips.map((tip) => (
            <div 
              key={tip.id} 
              className="p-3 bg-muted/20 border border-muted rounded-lg"
            >
              <h3 className="font-medium text-sm mb-1">{tip.title}</h3>
              <p className="text-sm text-muted-foreground">{tip.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
