
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { PatientStats } from '../PatientStats';

export const ExerciseTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Exercise Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PatientStats showExerciseOnly />
        </CardContent>
      </Card>
    </div>
  );
};
