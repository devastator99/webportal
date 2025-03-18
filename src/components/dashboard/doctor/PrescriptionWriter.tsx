
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Plus, Eye, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientSelector } from "./prescription/PatientSelector";
import { PrescriptionForm } from "./prescription/PrescriptionForm";
import { PrescriptionHistory } from "./prescription/PrescriptionHistory";
import { ConfirmationDialog } from "./prescription/ConfirmationDialog";
import { usePrescriptions } from "./prescription/usePrescriptions";
import { AssignNutritionistDialog } from "./prescription/AssignNutritionistDialog";
import { useToast } from "@/hooks/use-toast";

export const PrescriptionWriter = () => {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [activeTab, setActiveTab] = useState("write");
  const [showAssignNutritionist, setShowAssignNutritionist] = useState(false);
  const [lastSavedPrescriptionId, setLastSavedPrescriptionId] = useState<string | null>(null);
  const { toast } = useToast();
  
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

  // Handler for when a patient is selected
  const handlePatientSelect = () => {
    if (activeTab === "write") {
      resetForm();
    }
  };

  // Handler for when a prescription is saved successfully
  const handlePrescriptionSaved = (prescriptionId: string) => {
    setLastSavedPrescriptionId(prescriptionId);
    toast({
      title: "Prescription saved",
      description: "Would you like to assign a nutritionist to this patient?",
      action: (
        <div 
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 rounded-md px-3 text-xs cursor-pointer flex items-center"
          onClick={() => setShowAssignNutritionist(true)}
        >
          Assign
        </div>
      ),
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Prescription Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PatientSelector 
          selectedPatient={selectedPatient}
          setSelectedPatient={setSelectedPatient}
          onPatientSelect={handlePatientSelect}
        />

        {selectedPatient && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="write" className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Write Prescription
              </TabsTrigger>
              <TabsTrigger value="view" className="flex items-center gap-2">
                <Eye className="h-4 w-4" /> View Prescriptions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="write" className="space-y-4 pt-4">
              <PrescriptionForm
                diagnosis={diagnosis}
                setDiagnosis={setDiagnosis}
                prescription={prescription}
                setPrescription={setPrescription}
                notes={notes}
                setNotes={setNotes}
                onSavePrescription={handleSavePrescriptionRequest}
                isSaving={isSaving}
                onPrescriptionSaved={handlePrescriptionSaved}
              />
            </TabsContent>
            
            <TabsContent value="view" className="pt-4">
              <PrescriptionHistory 
                prescriptions={pastPrescriptions} 
                onAssignNutritionist={(prescriptionId) => {
                  setLastSavedPrescriptionId(prescriptionId);
                  setShowAssignNutritionist(true);
                }}
              />
            </TabsContent>
          </Tabs>
        )}

        <ConfirmationDialog 
          isOpen={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          onConfirm={() => {
            handleSavePrescription().then((prescriptionId) => {
              if (prescriptionId) {
                handlePrescriptionSaved(prescriptionId);
              }
            });
          }}
          diagnosis={diagnosis}
          prescription={prescription}
          notes={notes}
          isSaving={isSaving}
        />

        {showAssignNutritionist && selectedPatient && lastSavedPrescriptionId && (
          <AssignNutritionistDialog
            isOpen={showAssignNutritionist}
            onClose={() => setShowAssignNutritionist(false)}
            patientId={selectedPatient}
            prescriptionId={lastSavedPrescriptionId}
          />
        )}
      </CardContent>
    </Card>
  );
};
