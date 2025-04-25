
import React from 'react';
import { Lightbulb } from "lucide-react";

interface PatientCuratedHealthTipsProps {
  filterType?: 'diet' | 'mental' | string;
}

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
    category: "diet"
  },
  {
    id: "4",
    title: "Practice Mindfulness",
    content: "Daily meditation can help reduce stress and improve mental clarity.",
    category: "mental"
  },
  {
    id: "5",
    title: "Balanced Nutrition",
    content: "Aim for a colorful plate with diverse vegetables and fruits.",
    category: "diet"
  },
  {
    id: "6",
    title: "Stress Management",
    content: "Try deep breathing exercises when feeling overwhelmed.",
    category: "mental"
  },
];

export const PatientCuratedHealthTips = ({ filterType }: PatientCuratedHealthTipsProps) => {
  // Filter tips based on filterType if provided
  const displayTips = filterType 
    ? mockHealthTips.filter(tip => tip.category === filterType)
    : mockHealthTips;
    
  if (!displayTips.length) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No health tips available for this category.</p>
      </div>
    );
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
        {displayTips.map((tip) => (
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
