
import React from 'react';
import { Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
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
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-yellow-100 p-2 rounded-full">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Personalized Health Tips</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered suggestions tailored to your health profile
          </p>
        </div>
      </div>
      
      <div>
        {mockHealthTips.map((tip) => (
          <Card 
            key={tip.id} 
            className="p-4 transition-all duration-200 hover:shadow-md"
          >
            <h3 className="font-medium text-sm mb-2">{tip.title}</h3>
            <p className="text-sm text-muted-foreground">{tip.content}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
