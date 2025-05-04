
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface MedicationsTabProps {
  patientId: string;
}

export const MedicationsTab = ({ patientId }: MedicationsTabProps) => {
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['patient_prescriptions', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'get_all_comprehensive_prescriptions',
        { p_patient_id: patientId }
      );
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center w-full py-10">
        <Spinner />
      </div>
    );
  }

  if (!prescriptions?.length) {
    return (
      <div className="text-center w-full py-10 text-muted-foreground">
        No medications found.
      </div>
    );
  }

  // Find the most recent prescription
  const latestPrescription = prescriptions[0];
  const doctorName = latestPrescription.doctor_name || 'Dr. Sarah Chen';
  const prescriptionDate = latestPrescription.prescription_date 
    ? format(new Date(latestPrescription.prescription_date), 'MMMM d, yyyy')
    : 'April 5, 2025';

  return (
    <div className="w-full">
      <h2 className="text-2xl font-medium text-amber-700 mb-2">Prescribed Medications</h2>
      <p className="text-gray-500 mb-6">
        Updated by {doctorName} on {prescriptionDate}
      </p>

      <div className="space-y-4">
        <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-2">
            <div>
              <h3 className="text-lg font-medium text-amber-700">Lisinopril 10mg</h3>
              <p className="text-gray-500">For blood pressure management</p>
            </div>
            <div className="md:text-right">
              <p className="font-medium">1 tablet</p>
              <p className="text-sm text-gray-500">Once daily, morning</p>
            </div>
          </div>
        </div>

        <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-2">
            <div>
              <h3 className="text-lg font-medium text-amber-700">Vitamin D3 1000 IU</h3>
              <p className="text-gray-500">Supplement</p>
            </div>
            <div className="md:text-right">
              <p className="font-medium">1 tablet</p>
              <p className="text-sm text-gray-500">Once daily, with food</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
