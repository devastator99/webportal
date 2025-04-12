
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

// Simplified version that doesn't make any database calls
const PatientPrescriptionsPage = () => {
  return (
    <div className="container pt-16 pb-8 prescription-page-container">
      <h1 className="text-2xl font-bold mb-4">My Prescriptions</h1>
      <p className="text-muted-foreground mb-8">
        View and manage your prescriptions from your doctor.
      </p>
      
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center pb-2">
          <FileText className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle>Your Prescriptions</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p>
            This page will display your prescription history.
          </p>
          <p className="mt-2 text-muted-foreground">
            Currently no prescriptions available. Check back after your next appointment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientPrescriptionsPage;
