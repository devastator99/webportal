
import React from 'react';
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
    <div className="text-left">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-yellow-500" />
        Personalized Health Tips
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        AI-powered suggestions tailored to your health profile
      </p>
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
    </div>
  );
};
