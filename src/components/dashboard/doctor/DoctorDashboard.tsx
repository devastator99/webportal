
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { StatsCards } from "./StatsCards";
import { EnhancedPatientList } from "./EnhancedPatientList";
import { supabase } from "@/integrations/supabase/client";

export const DoctorDashboard = () => {
  const { user } = useAuth();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["doctor_patients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_doctor_patients', {
          p_doctor_id: user.id
        });
        
      if (error) throw error;
      
      // Add created_at field to all patients since it's required by the component
      // The RPC call doesn't return created_at
      const patientsWithCreatedAt = (data || []).map(patient => ({
        ...patient,
        created_at: new Date().toISOString() // Use current date as fallback for all patients
      }));
      
      return patientsWithCreatedAt;
    },
    enabled: !!user?.id
  });

  return (
    <div className="container mx-auto space-y-6 p-6">
      <StatsCards />
      <EnhancedPatientList patients={patients} isLoading={isLoading} />
    </div>
  );
};
