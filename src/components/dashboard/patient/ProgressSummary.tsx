
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Activity, Dumbbell, Utensils, Moon, Brain } from "lucide-react";

interface ProgressSummaryProps {
  summaryData: {
    physical: number;
    nutrition: number;
    sleep: number;
    mindfulness: number;
  };
  percentages: {
    physical: number;
    nutrition: number;
    sleep: number;
    mindfulness: number;
  };
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({ summaryData, percentages }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Progress Summary
        </CardTitle>
        <CardDescription>
          Your health journey progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-blue-500" />
                Physical Activity
              </h4>
              <Badge variant="outline">{percentages.physical}%</Badge>
            </div>
            <Progress value={percentages.physical} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Utensils className="h-4 w-4 text-green-500" />
                Nutrition
              </h4>
              <Badge variant="outline">{percentages.nutrition}%</Badge>
            </div>
            <Progress value={percentages.nutrition} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Moon className="h-4 w-4 text-indigo-500" />
                Sleep
              </h4>
              <Badge variant="outline">{percentages.sleep}%</Badge>
            </div>
            <Progress value={percentages.sleep} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                Mindfulness
              </h4>
              <Badge variant="outline">{percentages.mindfulness}%</Badge>
            </div>
            <Progress value={percentages.mindfulness} className="h-2" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="outline" size="sm" onClick={() => {}}>
          View detailed stats
        </Button>
      </CardFooter>
    </Card>
  );
};
