
import React from 'react';
import { HealthPlanItem } from '@/interfaces/HealthHabits';
import { Activity, CheckCircle2, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { HealthPlanItemCard } from './HealthPlanItem';

interface HealthPlanSummaryProps {
  healthPlanItems: HealthPlanItem[] | null | undefined;
  onSetupReminder: (item: HealthPlanItem) => void;
  onMarkComplete: (item: HealthPlanItem) => void;
}

export const HealthPlanSummary: React.FC<HealthPlanSummaryProps> = ({ 
  healthPlanItems, 
  onSetupReminder, 
  onMarkComplete 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Today's Habits
        </CardTitle>
        <CardDescription>
          Your health plan for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(!healthPlanItems || healthPlanItems.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No Health Plan Found</h3>
            <p className="text-muted-foreground">
              You don't have any habits or health plan items assigned yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {healthPlanItems.slice(0, 5).map((item) => (
              <HealthPlanItemCard
                key={item.id}
                item={item}
                onSetupReminder={onSetupReminder}
                onMarkComplete={onMarkComplete}
              />
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="outline" size="sm" asChild>
          <a href="#plan-section">View full plan</a>
        </Button>
      </CardFooter>
    </Card>
  );
};
