
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Medication {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  timing?: string;
  instructions?: string;
}

interface PrescribedTest {
  test_name: string;
  instructions?: string;
}

interface VitalsData {
  blood_pressure?: string;
  temperature?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
}

export interface PrescriptionData {
  diagnosis: string;
  notes?: string;
  vitals?: VitalsData;
  follow_up_date?: string;
  validity_period?: number;
  format_type?: string;
  medications: Medication[];
  tests: PrescribedTest[];
}

export const usePrescriptions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const savePrescription = async (patientId: string, data: PrescriptionData): Promise<string | null> => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create prescriptions",
        variant: "destructive",
      });
      return null;
    }

    try {
      setIsLoading(true);

      // Cast the complex objects to unknown first, then to any to satisfy TypeScript's Json type requirements
      const { data: result, error } = await supabase.rpc(
        'save_structured_prescription',
        {
          p_patient_id: patientId,
          p_doctor_id: user.id,
          p_diagnosis: data.diagnosis,
          p_notes: data.notes || null,
          p_vitals: data.vitals as unknown as Record<string, any>,
          p_follow_up_date: data.follow_up_date || null,
          p_validity_period: data.validity_period || 30,
          p_format_type: data.format_type || 'standard',
          p_medications: data.medications as unknown as Record<string, any>[],
          p_tests: data.tests as unknown as Record<string, any>[]
        }
      );

      if (error) {
        console.error("Error saving prescription:", error);
        throw error;
      }

      return result;
    } catch (error: any) {
      console.error("Exception in savePrescription:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save prescription",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getPrescription = async (prescriptionId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.rpc(
        'get_comprehensive_prescription',
        { p_prescription_id: prescriptionId }
      );

      if (error) {
        console.error("Error fetching prescription:", error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Exception in getPrescription:", error);
      toast({
        title: "Error",
        description: "Failed to load prescription details",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getPatientPrescriptions = async (patientId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.rpc(
        'get_all_comprehensive_prescriptions',
        { p_patient_id: patientId }
      );

      if (error) {
        console.error("Error fetching prescriptions:", error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error("Exception in getPatientPrescriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    savePrescription,
    getPrescription,
    getPatientPrescriptions
  };
};
