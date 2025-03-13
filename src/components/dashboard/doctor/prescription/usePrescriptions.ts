
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

  // Fetch prescriptions for the selected patient
  const { data: pastPrescriptions, refetch: refetchPrescriptions } = useQuery({
    queryKey: ["patient_prescriptions", selectedPatient, user?.id],
    queryFn: async () => {
      if (!selectedPatient || !user?.id) {
        return [] as MedicalRecord[];
      }
      
      try {
        // First, get basic medical records
        const { data: records, error } = await supabase
          .from('medical_records')
          .select(`
            id,
            created_at,
            diagnosis,
            prescription,
            notes,
            doctor_id,
            patient_id
          `)
          .eq('patient_id', selectedPatient)
          .eq('doctor_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        // Now, for each record, get doctor and patient details separately
        const enhancedRecords = await Promise.all((records || []).map(async (record) => {
          // Get doctor details
          const { data: doctorData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', record.doctor_id)
            .single();
          
          // Get patient details
          const { data: patientData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', record.patient_id)
            .single();
          
          // Combine all data
          return {
            ...record,
            doctor_first_name: doctorData?.first_name || null,
            doctor_last_name: doctorData?.last_name || null,
            patient_first_name: patientData?.first_name || null,
            patient_last_name: patientData?.last_name || null
          } as MedicalRecord;
        }));
        
        return enhancedRecords;
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
