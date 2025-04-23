
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

const mockHealthTips = [
  {
    id: "1",
    title: "Stay Consistent with Medication",
    content: "Take prescriptions regularly to improve treatment outcomes.",
    category: "medication"
  },
  {
    id: "2",
    title: "Monitor Daily Habits",
    content: "Track sleep, water intake, and exercise to spot health patterns.",
    category: "lifestyle"
  },
  {
    id: "3",
    title: "Personalize Your Diet",
    content: "Incorporate more fiber, less sugar to manage diabetes risk.",
    category: "nutrition"
  },
];

export const PatientCuratedHealthTips = () => {
  if (!mockHealthTips.length) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          Personalized Health Tips
        </CardTitle>
        <CardDescription className="text-xs">
          AI-powered suggestions tailored to your health profile
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          {mockHealthTips.map((tip) => (
            <div 
              key={tip.id} 
              className="p-2 bg-muted/10 border border-muted rounded-lg"
            >
              <h3 className="font-medium text-xs mb-1">{tip.title}</h3>
              <p className="text-xs text-muted-foreground">{tip.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
