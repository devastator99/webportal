
import React from 'react';
import { Lightbulb } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useResponsive } from "@/contexts/ResponsiveContext";

const mockHealthTips = [
  {
    id: "1",
    title: "Stay Consistent with Medication",
    content: "Take prescriptions regularly to improve treatment outcomes.",
    category: "medication"
  }
];

export const PatientCuratedHealthTips = () => {
  const { isMobile, isTablet } = useResponsive();

  if (!mockHealthTips.length) {
    return null;
  }

  return (
    <Card className="h-full bg-[#E5DEFF]/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="bg-[#E5DEFF] p-2 rounded-full">
            <Lightbulb className="h-4 w-4 text-[#9b87f5]" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">Personalized Health Tips</CardTitle>
            <CardDescription className="text-xs">
              AI-powered suggestions for your health
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mockHealthTips.map((tip) => (
          <div 
            key={tip.id} 
            className="p-3 bg-white/50 backdrop-blur-sm rounded-lg"
          >
            <h3 className="font-medium text-sm mb-2">{tip.title}</h3>
            <p className="text-xs text-muted-foreground">{tip.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
