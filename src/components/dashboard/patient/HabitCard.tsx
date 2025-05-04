
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, addDays } from 'date-fns';
import { Calendar, Droplet, Activity, Apple, Brain, Moon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { EditButton } from "@/components/ui/edit-button";

interface HabitCardProps {
  habit: {
    id: string;
    type: string;
    description: string;
    frequency: string;
  };
  onComplete: (habitId: string, completed: boolean) => void;
  completed?: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onComplete, completed = false }) => {
  const [view, setView] = useState<'daily' | 'weekly' | 'overall'>('daily');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [weeklyProgress, setWeeklyProgress] = useState<Record<number, boolean>>({});

  // Get habit icon based on type
  const getHabitIcon = () => {
    switch (habit.type) {
      case 'food':
        return <Apple className="h-6 w-6 text-red-500" />;
      case 'exercise':
        return <Activity className="h-6 w-6 text-green-500" />;
      case 'sleep':
        return <Moon className="h-6 w-6 text-indigo-500" />;
      case 'mindfulness':
        return <Brain className="h-6 w-6 text-purple-500" />;
      case 'water':
        return <Droplet className="h-6 w-6 text-blue-500" />;
      default:
        return <Activity className="h-6 w-6 text-[#9b87f5]" />;
    }
  };

  // Get background color based on habit type
  const getCardBgColor = () => {
    switch (habit.type) {
      case 'food':
        return 'bg-red-50';
      case 'exercise':
        return 'bg-green-50';
      case 'sleep':
        return 'bg-blue-50';
      case 'mindfulness':
        return 'bg-purple-50';
      case 'water':
        return 'bg-blue-50';
      default:
        return 'bg-gray-50';
    }
  };

  // Generate days of the week
  const generateWeekDays = () => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(startOfCurrentWeek, i);
      const dayName = format(day, 'EEE');
      const dayNumber = format(day, 'd');
      const isToday = format(today, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      
      return (
        <div 
          key={i}
          className={cn(
            "flex flex-col items-center justify-center rounded-full p-2 cursor-pointer transition-colors",
            isToday ? "border-2 border-[#9b87f5]" : "border border-gray-200",
            weeklyProgress[i] ? "bg-green-500 text-white" : "bg-white"
          )}
          onClick={() => {
            setSelectedDay(i);
            const newProgress = { ...weeklyProgress };
            newProgress[i] = !newProgress[i];
            setWeeklyProgress(newProgress);
            onComplete(habit.id, !weeklyProgress[i]);
          }}
        >
          <span className="text-sm font-medium">{dayName}</span>
          <span className="text-lg font-semibold">{dayNumber}</span>
        </div>
      );
    });
  };

  // Handle daily tracking view
  const DailyView = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-2">
        {getHabitIcon()}
        <span className="text-lg font-medium text-amber-800">{habit.description}</span>
      </div>
      <div
        className={cn(
          "w-8 h-8 rounded-full border cursor-pointer transition-all flex items-center justify-center",
          completed ? "bg-green-500 border-green-600" : "border-gray-300"
        )}
        onClick={() => onComplete(habit.id, !completed)}
      >
        {completed && (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  );

  // Handle weekly tracking view
  const WeeklyView = () => (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-7 gap-2">{generateWeekDays()}</div>
    </div>
  );

  // Handle overall tracking view (placeholder for now)
  const OverallView = () => (
    <div className="flex items-center justify-center py-8 text-gray-500">
      Overall tracking view coming soon
    </div>
  );

  return (
    <Card className={cn("mb-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow", getCardBgColor())}>
      <div className="p-4">
        <div className="flex items-center mb-4">
          {getHabitIcon()}
          <span className="ml-2 text-xl font-medium text-amber-800">{habit.description}</span>
        </div>
        
        <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 mb-4">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 gap-1", 
              view === 'daily' ? "bg-white shadow-sm" : "text-gray-500"
            )}
            onClick={() => setView('daily')}
          >
            <Calendar className="h-4 w-4 text-amber-800" />
            <span className="text-amber-800">Daily</span>
          </Button>
          <Button
            variant="ghost" 
            size="sm"
            className={cn(
              "flex-1 gap-1", 
              view === 'weekly' ? "bg-white shadow-sm" : "text-gray-500"
            )}
            onClick={() => setView('weekly')}
          >
            <Calendar className="h-4 w-4 text-amber-800" />
            <span className="text-amber-800">Weekly</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 gap-1", 
              view === 'overall' ? "bg-white shadow-sm" : "text-gray-500"
            )}
            onClick={() => setView('overall')}
          >
            <Calendar className="h-4 w-4 text-amber-800" />
            <span className="text-amber-800">Overall</span>
          </Button>
        </div>
        
        {view === 'daily' && <DailyView />}
        {view === 'weekly' && <WeeklyView />}
        {view === 'overall' && <OverallView />}
      </div>
    </Card>
  );
};
