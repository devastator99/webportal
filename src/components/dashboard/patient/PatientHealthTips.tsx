
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

// Mock health tips - In a real application, these would come from the AI assistant
// based on the patient's prescriptions, health plan, etc.
const healthTips = [
  {
    id: 1,
    title: "Stay Hydrated",
    content: "Drink at least 8 glasses of water daily to maintain hydration, especially during physical activity.",
    category: "general"
  },
  {
    id: 2,
    title: "Mindful Eating",
    content: "Take time to enjoy your meals without distractions. This helps prevent overeating and improves digestion.",
    category: "nutrition"
  },
  {
    id: 3,
    title: "Stretching Benefits",
    content: "Incorporate 10 minutes of stretching into your morning routine to improve flexibility and reduce muscle tension.",
    category: "fitness"
  },
];

export const PatientHealthTips = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Health Tips For You
        </CardTitle>
        <CardDescription>
          Personalized suggestions based on your health data
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
