
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientSelector } from "../doctor/prescription/PatientSelector";
import { PrescriptionForm } from "../doctor/prescription/PrescriptionForm";
import { PrescriptionHistory } from "../doctor/prescription/PrescriptionHistory";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionWriterProps {
  patientId?: string;  // Optional when accessed from dashboard
  onPrescriptionSaved?: () => void;
}

export const PrescriptionWriter: React.FC<PrescriptionWriterProps> = ({ patientId: initialPatientId, onPrescriptionSaved }) => {
  const [selectedPatient, setSelectedPatient] = useState<string>(initialPatientId || "");
  const [activeTab, setActiveTab] = useState<string>("write");
  const [savedPrescriptionId, setSavedPrescriptionId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Update selected patient if initialPatientId changes
    if (initialPatientId) {
      setSelectedPatient(initialPatientId);
    }
  }, [initialPatientId]);

  const onPatientSelect = () => {
    setActiveTab("write");
    setSavedPrescriptionId(null);
  };

  const handlePrescriptionSaved = (id: string) => {
    setSavedPrescriptionId(id);
    toast({
      title: "Success",
      description: "Prescription saved successfully"
    });
    
    if (onPrescriptionSaved) {
      onPrescriptionSaved();
    }
  };

  const handleAssignNutritionist = (prescriptionId: string) => {
    console.log("Assigning nutritionist for prescription:", prescriptionId);
  };

  return (
    <Card className="col-span-6">
      <CardHeader>
        <CardTitle>Prescription Writer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {!initialPatientId && (
            <PatientSelector 
              selectedPatient={selectedPatient}
              setSelectedPatient={setSelectedPatient}
              onPatientSelect={onPatientSelect}
            />
          )}
          
          {selectedPatient && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="write">Write Prescription</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="write" className="mt-4">
                <PrescriptionForm
                  patientId={selectedPatient}
                  onSaved={savedPrescriptionId ? undefined : handlePrescriptionSaved}
                />
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                <PrescriptionHistory 
                  patientId={selectedPatient}
                  onAssignNutritionist={handleAssignNutritionist}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
