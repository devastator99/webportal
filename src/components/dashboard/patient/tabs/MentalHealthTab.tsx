
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { PatientCuratedHealthTips } from '../PatientCuratedHealthTips';

export const MentalHealthTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Mental Wellness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PatientCuratedHealthTips filterType="mental" />
        </CardContent>
      </Card>
    </div>
  );
};
