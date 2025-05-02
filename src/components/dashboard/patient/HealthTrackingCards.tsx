
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Utensils, Moon, Brain } from "lucide-react";

interface HealthTrackingCardProps {
  title: string;
  value: string;
  percentage: number;
  icon: React.ReactNode;
}

const HealthTrackingCard = ({ title, value, percentage, icon }: HealthTrackingCardProps) => {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{title}</h3>
            {icon}
          </div>
          <span className="text-sm font-medium">{value}</span>
        </div>
        <div className="space-y-2">
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {percentage}% of daily goal
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

interface HealthTrackingCardsProps {
  habitSummary: any[] | null;
}

export const HealthTrackingCards = ({ habitSummary }: HealthTrackingCardsProps) => {
  // Utility functions to calculate percentages and format values
  const getHabitPercentage = (habitType: string): number => {
    if (!habitSummary) return 0;
    
    const habit = habitSummary.find(h => h.habit_type === habitType);
    if (!habit) return 0;
    
    const targetValues: Record<string, number> = {
      physical: 60, // 60 minutes per day
      nutrition: 8, // score out of 10
      sleep: 8, // 8 hours
      mindfulness: 20 // 20 minutes
    };
    
    return Math.min(100, Math.round((habit.avg_value / targetValues[habitType]) * 100));
  };

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
    
    return `${habit?.avg_value || 0}${units[habitType]}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <HealthTrackingCard 
        title="Physical Activity" 
        value={getHabitValue('physical')} 
        percentage={getHabitPercentage('physical')}
        icon={<Activity className="h-4 w-4 text-[#9b87f5]" />} 
      />
      
      <HealthTrackingCard 
        title="Nutrition" 
        value={getHabitValue('nutrition')} 
        percentage={getHabitPercentage('nutrition')}
        icon={<Utensils className="h-4 w-4 text-[#9b87f5]" />} 
      />
      
      <HealthTrackingCard 
        title="Sleep" 
        value={getHabitValue('sleep')} 
        percentage={getHabitPercentage('sleep')}
        icon={<Moon className="h-4 w-4 text-[#9b87f5]" />} 
      />
      
      <HealthTrackingCard 
        title="Mindfulness" 
        value={getHabitValue('mindfulness')} 
        percentage={getHabitPercentage('mindfulness')}
        icon={<Brain className="h-4 w-4 text-[#9b87f5]" />} 
      />
    </div>
  );
};
