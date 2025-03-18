
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Prescription {
  id: string;
  created_at: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  patient_id: string;
  doctor_id?: string;
}

export const usePrescriptions = (patientId: string) => {
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pastPrescriptions, setPastPrescriptions] = useState<Prescription[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (patientId && user) {
      fetchPrescriptions();
    }
  }, [patientId, user]);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_doctor_patient_records', {
        p_doctor_id: user?.id,
        p_patient_id: patientId
      });
      
      if (error) {
        throw error;
      }

      // Transform the data to include patient_id
      const prescriptionsWithPatientId = data.map((prescription: any) => ({
        ...prescription,
        patient_id: patientId
      }));
      
      setPastPrescriptions(prescriptionsWithPatientId);
    } catch (error: any) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: "Error",
        description: `Failed to load prescriptions: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setDiagnosis("");
    setPrescription("");
    setNotes("");
  };

  const handleSavePrescriptionRequest = () => {
    if (!diagnosis.trim() || !prescription.trim()) {
      toast({
        title: "Error",
        description: "Diagnosis and prescription are required",
        variant: "destructive",
      });
      return;
    }

    setConfirmDialogOpen(true);
  };

  const handleSavePrescription = async () => {
    if (!user || !patientId) {
      toast({
        title: "Error",
        description: "Missing user or patient information",
        variant: "destructive",
      });
      return null;
    }

    try {
      setIsSaving(true);

      const { data, error } = await supabase.rpc('save_prescription', {
        p_patient_id: patientId,
        p_doctor_id: user.id,
        p_diagnosis: diagnosis,
        p_prescription: prescription,
        p_notes: notes
      });
      
      if (error) {
        throw error;
      }

      setConfirmDialogOpen(false);
      toast({
        title: "Success",
        description: "Prescription saved successfully",
      });
      
      // Reset form
      resetForm();
      
      // Refresh prescriptions list
      await fetchPrescriptions();
      
      return data;
    } catch (error: any) {
      console.error('Error saving prescription:', error);
      toast({
        title: "Error",
        description: `Failed to save prescription: ${error.message}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
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
