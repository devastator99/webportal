
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Bell, CheckCircle2 } from "lucide-react";
import { HealthPlanItem } from '@/interfaces/HealthHabits';

interface TypeIconsProps {
  [key: string]: React.ReactNode;
}

interface DetailedHealthPlanProps {
  groupedItems: Record<string, HealthPlanItem[]>;
  typeIcons: TypeIconsProps;
  onSetupReminder: (item: HealthPlanItem) => void;
  onMarkComplete: (item: HealthPlanItem) => void;
}

export const DetailedHealthPlan: React.FC<DetailedHealthPlanProps> = ({ 
  groupedItems, 
  typeIcons, 
  onSetupReminder, 
  onMarkComplete 
}) => {
  return (
    <div className="space-y-6">
      {Object.entries(groupedItems).map(([type, items]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {typeIcons[type as keyof typeof typeIcons] || <Activity className="h-5 w-5" />}
              {type.charAt(0).toUpperCase() + type.slice(1)} Plan
            </CardTitle>
            <CardDescription>
              Your personalized {type} recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{item.description}</h3>
                    <Badge variant="outline">{item.frequency}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Scheduled for: {item.scheduled_time}</p>
                  {item.duration && (
                    <p className="text-sm text-muted-foreground">Duration: {item.duration}</p>
                  )}
                  <div className="pt-2 flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onSetupReminder(item)}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Set Reminder
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onMarkComplete(item)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
