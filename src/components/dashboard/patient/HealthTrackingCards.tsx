
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Heart, Moon, Brain } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HabitSummary {
  habit_type: string;
  avg_value: number;
}

interface HealthTrackingCardsProps {
  habitSummary?: HabitSummary[];
}

export const HealthTrackingCards = ({ habitSummary }: HealthTrackingCardsProps) => {
  const isMobile = useIsMobile();

  const getHabitValue = (habitType: string): string => {
    if (!habitSummary) return "0";
    
    const habit = habitSummary.find(h => h.habit_type === habitType);
    if (!habit) return "0";
    
    const units: Record<string, string> = {
      physical: "min",
      nutrition: "/10", 
      sleep: "hrs",
      mindfulness: "min"
    };
    
    return `${habit.avg_value}${units[habitType]}`;
  };

  const getHabitPercentage = (habitType: string): number => {
    if (!habitSummary) return 0;
    
    const habit = habitSummary.find(h => h.habit_type === habitType);
    if (!habit) return 0;
    
    const targetValues: Record<string, number> = {
      physical: 60,
      nutrition: 8,
      sleep: 8,
      mindfulness: 20
    };
    
    return Math.min(100, Math.round((habit.avg_value / targetValues[habitType]) * 100));
  };

  const habits = [
    {
      name: "Physical Activity",
      type: "physical",
      icon: Activity,
      color: "text-green-500"
    },
    {
      name: "Nutrition",
      type: "nutrition", 
      icon: Heart,
      color: "text-red-500"
    },
    {
      name: "Sleep",
      type: "sleep",
      icon: Moon,
      color: "text-blue-500"
    },
    {
      name: "Mindfulness",
      type: "mindfulness",
      icon: Brain,
      color: "text-purple-500"
    }
  ];

  return (
    <div className="health-cards-grid">
      {habits.map((habit) => {
        const Icon = habit.icon;
        const value = getHabitValue(habit.type);
        const percentage = getHabitPercentage(habit.type);
        
        return (
          <Card key={habit.type} className="health-card border-2 border-purple-400 hover:border-purple-500 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${habit.color}`} />
                  <h3 className="health-card-title text-sm sm:text-base font-medium">{habit.name}</h3>
                </div>
                <span className="font-semibold text-sm sm:text-base">{value}</span>
              </div>
              <div className="space-y-2">
                <Progress value={percentage} className="h-2" />
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {percentage}% of goal
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
