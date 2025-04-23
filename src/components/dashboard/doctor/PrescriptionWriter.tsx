
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientSelector } from "../doctor/prescription/PatientSelector";
import { PrescriptionForm } from "../doctor/prescription/PrescriptionForm";
import { PrescriptionHistory } from "../doctor/prescription/PrescriptionHistory";
import { ConfirmationDialog } from "../doctor/prescription/ConfirmationDialog";
import { usePrescriptions } from "../doctor/prescription/usePrescriptions";

export const PrescriptionWriter = () => {
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("write");
  const [savedPrescriptionId, setSavedPrescriptionId] = useState<string | null>(null);
  
  const {
    diagnosis,
    setDiagnosis,
    prescription,
    setPrescription,
    notes,
    setNotes,
    confirmDialogOpen,
    setConfirmDialogOpen,
    isSaving,
    pastPrescriptions,
    handleSavePrescriptionRequest,
    handleSavePrescription,
    resetForm
  } = usePrescriptions(selectedPatient);

  const onPatientSelect = () => {
    resetForm();
    setActiveTab("write");
    setSavedPrescriptionId(null);
  };

  const onConfirmSave = async () => {
    const newPrescriptionId = await handleSavePrescription();
    if (newPrescriptionId) {
      setSavedPrescriptionId(newPrescriptionId);
    }
  };

  const onSavePrescriptionWithId = () => {
    handleSavePrescriptionRequest();
  };

  const handleAssignNutritionist = (prescriptionId: string) => {
    console.log("Assigning nutritionist for prescription:", prescriptionId);
  };

  useEffect(() => {
    resetForm();
  }, [selectedPatient]);

  return (
    <Card className="col-span-6">
      <CardHeader>
        <CardTitle>Prescription Writer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <PatientSelector 
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
            onPatientSelect={onPatientSelect}
          />
          
          {selectedPatient && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="write">Write Prescription</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="write" className="mt-4">
                <PrescriptionForm
                  patientId={selectedPatient}
                  onSaved={savedPrescriptionId ? undefined : (id) => setSavedPrescriptionId(id)}
                />
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                <PrescriptionHistory 
                  prescriptions={pastPrescriptions} 
                  onAssignNutritionist={handleAssignNutritionist}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>

        <ConfirmationDialog
          isOpen={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          onConfirm={onConfirmSave}
          diagnosis={diagnosis}
          prescription={prescription}
          notes={notes}
          isSaving={isSaving}
        />
      </CardContent>
    </Card>
  );
};
