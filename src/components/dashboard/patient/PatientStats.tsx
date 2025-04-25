
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Droplet, Clock } from "lucide-react";

interface PatientStatsProps {
  showExerciseOnly?: boolean;
}

export const PatientStats = ({ showExerciseOnly = false }: PatientStatsProps) => {
  // Mock data for patient stats
  const statsData = {
    steps: 8247,
    distance: 6.2,
    hydration: 1.8,
    sleep: 7.2
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4 flex items-center space-x-4">
          <div className="bg-[#E5DEFF] p-3 rounded-full">
            <Activity className="h-6 w-6 text-[#9b87f5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Today's Steps</p>
            <div className="text-2xl font-bold">{statsData.steps.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{statsData.distance} km</p>
          </div>
        </CardContent>
      </Card>
      
      {!showExerciseOnly && (
        <>
          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="bg-[#E5DEFF] p-3 rounded-full">
                <Droplet className="h-6 w-6 text-[#9b87f5]" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hydration</p>
                <div className="text-2xl font-bold">{statsData.hydration}L</div>
                <p className="text-xs text-muted-foreground">of 2.5L goal</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="bg-[#E5DEFF] p-3 rounded-full">
                <Clock className="h-6 w-6 text-[#9b87f5]" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sleep</p>
                <div className="text-2xl font-bold">{statsData.sleep} hrs</div>
                <p className="text-xs text-muted-foreground">Last night</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
