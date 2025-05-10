
import React from 'react';
import { Card, CardContent, GlassCard } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Utensils, Moon, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthTrackingCardProps {
  title: string;
  value: string;
  percentage: number;
  icon: React.ReactNode;
  variant: 'activity' | 'nutrition' | 'sleep' | 'mindfulness';
}

const HealthTrackingCard = ({ title, value, percentage, icon, variant }: HealthTrackingCardProps) => {
  // Define variant-specific styling
  const variantStyles = {
    activity: {
      borderClass: "border-l-4 border-[#9b87f5]",
      shadowClass: "shadow-md hover:shadow-lg",
      glassClass: "glass-purple",
      hoverClass: "hover:-translate-y-1 transition-all duration-300"
    },
    nutrition: {
      borderClass: "border-l-4 border-green-500",
      shadowClass: "shadow-md hover:shadow-lg",
      glassClass: "glass-green",
      hoverClass: "hover:-translate-y-1 transition-all duration-300"
    },
    sleep: {
      borderClass: "border-l-4 border-blue-500",
      shadowClass: "shadow-md hover:shadow-lg",
      glassClass: "glass-blue",
      hoverClass: "hover:-translate-y-1 transition-all duration-300"
    },
    mindfulness: {
      borderClass: "border-l-4 border-amber-500",
      shadowClass: "shadow-md hover:shadow-lg",
      glassClass: "glass-amber",
      hoverClass: "hover:-translate-y-1 transition-all duration-300"
    }
  };

  return (
    <GlassCard 
      className={cn(
        "w-full", 
        variantStyles[variant].borderClass, 
        variantStyles[variant].shadowClass,
        variantStyles[variant].glassClass,
        variantStyles[variant].hoverClass
      )}
    >
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
    </GlassCard>
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
        variant="activity"
      />
      
      <HealthTrackingCard 
        title="Nutrition" 
        value={getHabitValue('nutrition')} 
        percentage={getHabitPercentage('nutrition')}
        icon={<Utensils className="h-4 w-4 text-green-500" />} 
        variant="nutrition"
      />
      
      <HealthTrackingCard 
        title="Sleep" 
        value={getHabitValue('sleep')} 
        percentage={getHabitPercentage('sleep')}
        icon={<Moon className="h-4 w-4 text-blue-500" />} 
        variant="sleep"
      />
      
      <HealthTrackingCard 
        title="Mindfulness" 
        value={getHabitValue('mindfulness')} 
        percentage={getHabitPercentage('mindfulness')}
        icon={<Brain className="h-4 w-4 text-amber-500" />} 
        variant="mindfulness"
      />
    </div>
  );
};
