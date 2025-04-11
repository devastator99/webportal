
import React from 'react';
import { Activity, Dumbbell, Utensils, Moon, Brain, CheckCircle2, Bell, Pill } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { HealthPlanItem } from '@/interfaces/HealthHabits';

const typeIcons = {
  food: <Utensils className="h-5 w-5 text-green-500" />,
  exercise: <Dumbbell className="h-5 w-5 text-blue-500" />,
  meditation: <Brain className="h-5 w-5 text-purple-500" />,
  sleep: <Moon className="h-5 w-5 text-indigo-500" />,
  medication: <Pill className="h-5 w-5 text-red-500" />
};

interface HealthPlanItemProps {
  item: HealthPlanItem;
  onSetupReminder: (item: HealthPlanItem) => void;
  onMarkComplete: (item: HealthPlanItem) => void;
}

export const HealthPlanItemCard: React.FC<HealthPlanItemProps> = ({ 
  item, 
  onSetupReminder, 
  onMarkComplete 
}) => {
  return (
    <div 
      className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {typeIcons[item.type as keyof typeof typeIcons] || 
            <Activity className="h-5 w-5 text-gray-500" />}
        </div>
        <div>
          <p className="font-medium text-sm">{item.description}</p>
          <p className="text-xs text-muted-foreground">{item.scheduled_time} • {item.frequency}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onMarkComplete(item)}
        >
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onSetupReminder(item)}
        >
          <Bell className="h-4 w-4 text-blue-500" />
        </Button>
      </div>
    </div>
  );
};
