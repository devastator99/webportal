
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedPatientList } from "./EnhancedPatientList";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const doctorName = `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim();
  const initials = `${(user?.user_metadata?.first_name?.[0] || '')}${(user?.user_metadata?.last_name?.[0] || '')}`.toUpperCase();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["doctor_patients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_doctor_patients', {
          p_doctor_id: user.id
        });
        
      if (error) throw error;
      
      const patientsWithCreatedAt = (data || []).map(patient => ({
        ...patient,
        created_at: new Date().toISOString()
      }));
      
      return patientsWithCreatedAt;
    },
    enabled: !!user?.id
  });

  return (
    <div className="container mx-auto space-y-6 p-6">
      <Card className="p-6 bg-white shadow-sm border-0">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 bg-[#E5DEFF]">
            <AvatarFallback className="text-[#9b87f5] text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, Dr. {user?.user_metadata?.last_name || 'Doctor'}
            </h1>
            <p className="text-gray-500">
              Here's an overview of your patients
            </p>
          </div>
        </div>
      </Card>
      <EnhancedPatientList patients={patients} isLoading={isLoading} />
    </div>
  );
};
