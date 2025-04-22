
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const mockHealthTips = [
  {
    id: "1",
    title: "Stay Consistent with Your Medication",
    content: "Taking your prescriptions regularly improves your treatment outcomes. Set reminders on your phone to never miss a dose.",
    category: "medication"
  },
  {
    id: "2",
    title: "Monitor Your Daily Habits",
    content: "Tracking activities like sleep, water intake, and exercise can help spot patterns that affect your health. Consider using a simple habit tracker.",
    category: "lifestyle"
  },
  {
    id: "3",
    title: "Personalize Your Diet",
    content: "Since your genetic profile and vital stats suggest higher risk for diabetes, incorporate more fiber and less sugar into your meals. Consult your care team for a tailored plan.",
    category: "nutrition"
  },
];

export const PatientCuratedHealthTips = () => {
  // Here you could check for user info from useAuth, but for mockup, it's not needed
  if (!mockHealthTips.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {/* Using the "info" icon from lucide-react as only approved Lucide icons are allowed */}
          <span className="inline-block rounded-full bg-yellow-200 p-1 mr-2">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              {/* Circled i for "info" */}
              <circle cx="10" cy="10" r="9" stroke="#facc15"/>
              <line x1="10" y1="7" x2="10" y2="13" stroke="#a16207"/>
              <circle cx="10" cy="15.25" r="1" fill="#a16207"/>
            </svg>
          </span>
          Personalized Health Tips
        </CardTitle>
        <CardDescription>
          AI-powered suggestions tailored to your health profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockHealthTips.map((tip) => (
            <div key={tip.id} className="p-3 bg-muted/20 border border-muted rounded-lg">
              <h3 className="font-medium text-sm mb-1">{tip.title}</h3>
              <p className="text-sm text-muted-foreground">{tip.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
