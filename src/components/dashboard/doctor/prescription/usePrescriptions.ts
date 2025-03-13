import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MedicalRecord {
  id: string;
  created_at: string;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
  doctor_id: string;
  patient_id: string;
  doctor_first_name: string | null;
  doctor_last_name: string | null;
  patient_first_name?: string | null;
  patient_last_name?: string | null;
}

export const usePrescriptions = (selectedPatient: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch prescriptions for the selected patient using our RPC function
  const { data: pastPrescriptions, refetch: refetchPrescriptions } = useQuery({
    queryKey: ["patient_prescriptions", selectedPatient, user?.id],
    queryFn: async () => {
      if (!selectedPatient || !user?.id) {
        return [] as MedicalRecord[];
      }
      
      try {
        // Use our secure RPC function to get prescriptions with patient and doctor details
        const { data, error } = await supabase
          .rpc('get_patient_prescriptions', {
            p_patient_id: selectedPatient,
            p_doctor_id: user.id
          });
        
        if (error) {
          throw error;
        }
        
        return data as MedicalRecord[] || [];
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
        return [] as MedicalRecord[];
      }
    },
    enabled: !!selectedPatient && !!user?.id,
  });

  const handleSavePrescriptionRequest = () => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive",
      });
      return;
    }

    if (!diagnosis.trim()) {
      toast({
        title: "Error",
        description: "Please enter a diagnosis",
        variant: "destructive",
      });
      return;
    }

    if (!prescription.trim()) {
      toast({
        title: "Error",
        description: "Please enter prescription details",
        variant: "destructive",
      });
      return;
    }

    setConfirmDialogOpen(true);
  };

  const handleSavePrescription = async () => {
    if (isSaving) return; 
    
    try {
      setIsSaving(true);
      
      if (!user?.id) {
        throw new Error("Doctor ID not available. Please try again later.");
      }
      
      // Use our security definer function to create a medical record
      const { data, error } = await supabase.rpc('create_medical_record', {
        p_patient_id: selectedPatient,
        p_doctor_id: user.id,
        p_diagnosis: diagnosis,
        p_prescription: prescription,
        p_notes: notes
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Prescription saved successfully",
      });

      setConfirmDialogOpen(false);
      
      // Reset form fields
      setDiagnosis("");
      setPrescription("");
      setNotes("");
      
      // Refresh the prescriptions list
      await refetchPrescriptions();
      
      // Invalidate any related queries
      queryClient.invalidateQueries({
        queryKey: ["patient_medical_records", selectedPatient]
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save prescription: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
      
    } finally {
      setIsSaving(false);
      setConfirmDialogOpen(false);
    }
  };

  const resetForm = () => {
    setDiagnosis("");
    setPrescription("");
    setNotes("");
  };

  return {
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
  };
};
