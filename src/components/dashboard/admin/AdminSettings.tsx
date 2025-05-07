
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SetUpDefaultNutritionistButton } from './SetUpDefaultNutritionistButton';
import { Separator } from "@/components/ui/separator";
import DefaultCareTeamSettings from './DefaultCareTeamSettings';

export const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Default Care Team Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure the default care team that will be assigned to new patients during registration.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          <SetUpDefaultNutritionistButton />
        </div>
        <Separator className="my-4" />
        <DefaultCareTeamSettings />
      </div>
    </div>
  );
};

export default AdminSettings;
