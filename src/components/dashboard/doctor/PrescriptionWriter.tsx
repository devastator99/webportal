
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientSelector } from "../doctor/prescription/PatientSelector";
import { PrescriptionForm } from "../doctor/prescription/PrescriptionForm";
import { PrescriptionHistory } from "../doctor/prescription/PrescriptionHistory";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PrescriptionWriterProps {
  patientId?: string;  // Optional when accessed from dashboard
  onPrescriptionSaved?: () => void;
  patientInfo?: {
    name?: string;
    age?: number;
    gender?: string;
    contactNumber?: string;
  };
}

export const PrescriptionWriter: React.FC<PrescriptionWriterProps> = ({ 
  patientId: initialPatientId, 
  onPrescriptionSaved,
  patientInfo: initialPatientInfo
}) => {
  const [selectedPatient, setSelectedPatient] = useState<string>(initialPatientId || "");
  const [activeTab, setActiveTab] = useState<string>("write");
  const [savedPrescriptionId, setSavedPrescriptionId] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState<any>(initialPatientInfo || null);
  const { toast } = useToast();

  useEffect(() => {
    // Update selected patient if initialPatientId changes
    if (initialPatientId) {
      setSelectedPatient(initialPatientId);
      
      // If we don't have patient info and we have a patient ID, fetch it
      if (!initialPatientInfo && initialPatientId) {
        const fetchPatientInfo = async () => {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', initialPatientId)
              .single();
              
            if (error) throw error;
            setPatientInfo({
              name: `${data.first_name} ${data.last_name}`
            });
          } catch (err) {
            console.error('Error fetching patient info:', err);
          }
        };
        
        fetchPatientInfo();
      }
    }
  }, [initialPatientId, initialPatientInfo]);

  const onPatientSelect = (patientData: any) => {
    setActiveTab("write");
    setSavedPrescriptionId(null);
    
    // Update patient info if available
    if (patientData && patientData.first_name) {
      setPatientInfo({
        name: `${patientData.first_name} ${patientData.last_name}`
      });
    }
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
    // Implementation would go here
  };

  return (
    <Card className="col-span-6">
      <CardHeader>
        <CardTitle>
          {patientInfo?.name 
            ? `Write Prescription for ${patientInfo.name}` 
            : 'Prescription Writer'}
        </CardTitle>
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
                  patientInfo={patientInfo}
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
