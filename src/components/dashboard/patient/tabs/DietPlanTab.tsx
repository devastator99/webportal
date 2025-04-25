
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientCuratedHealthTips } from '../PatientCuratedHealthTips';

export const DietPlanTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diet & Nutrition Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientCuratedHealthTips filterType="diet" />
        </CardContent>
      </Card>
    </div>
  );
};
