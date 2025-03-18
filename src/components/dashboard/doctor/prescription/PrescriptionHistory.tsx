
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { UserPlus } from "lucide-react";

interface PrescriptionHistoryProps {
  prescriptions: any[];
  onAssignNutritionist?: (prescriptionId: string) => void;
}

export const PrescriptionHistory = ({ prescriptions, onAssignNutritionist }: PrescriptionHistoryProps) => {
  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="text-center p-6 bg-muted rounded-md">
        <p className="text-muted-foreground">No previous prescriptions found for this patient.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prescriptions.map((prescription) => (
        <Card key={prescription.id} className="bg-card/50">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base">
                  Prescribed by Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(prescription.created_at), { addSuffix: true })}
                </p>
              </div>
              {onAssignNutritionist && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={() => onAssignNutritionist(prescription.id)}
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Assign Nutritionist</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  Diagnosis 
                  <Badge variant="outline" className="font-normal">Medical Assessment</Badge>
                </h4>
                <p className="text-muted-foreground whitespace-pre-line">{prescription.diagnosis}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-1">Prescription</h4>
                <p className="text-muted-foreground whitespace-pre-line">{prescription.prescription}</p>
              </div>
              
              {prescription.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-1">Additional Notes</h4>
                    <p className="text-muted-foreground whitespace-pre-line">{prescription.notes}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
