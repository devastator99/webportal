
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
  doctor_first_name?: string;
  doctor_last_name?: string;
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
      // Instead of RPC, use direct query to avoid TypeScript errors
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          id,
          created_at,
          diagnosis,
          prescription,
          notes,
          doctor_id,
          patient_id,
          doctor:profiles!medical_records_doctor_id_fkey(
            first_name,
            last_name
          )
        `)
        .eq('doctor_id', user?.id)
        .eq('patient_id', patientId);
      
      if (error) {
        throw error;
      }

      // Transform the data to match our Prescription interface
      const prescriptionsWithDoctorInfo = data.map((record: any) => ({
        id: record.id,
        created_at: record.created_at,
        diagnosis: record.diagnosis,
        prescription: record.prescription,
        notes: record.notes,
        patient_id: record.patient_id,
        doctor_id: record.doctor_id,
        doctor_first_name: record.doctor?.first_name,
        doctor_last_name: record.doctor?.last_name
      }));
      
      setPastPrescriptions(prescriptionsWithDoctorInfo);
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

      // Direct database insert instead of RPC call for better TypeScript support
      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          patient_id: patientId,
          doctor_id: user.id,
          diagnosis: diagnosis,
          prescription: prescription, 
          notes: notes
        })
        .select('id')
        .single();
      
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
      
      return data.id;
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
