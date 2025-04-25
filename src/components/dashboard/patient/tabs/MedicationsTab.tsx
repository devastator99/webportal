
import React from 'react';
import { MedicalRecordsList } from '../MedicalRecordsList';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";

export const MedicationsTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Prescriptions & Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => user?.id && navigate(`/prescriptions/${user.id}`)}
          >
            View All Prescriptions <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
      
      <MedicalRecordsList />
    </div>
  );
};
