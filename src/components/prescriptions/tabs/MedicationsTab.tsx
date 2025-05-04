
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
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
      <div className="flex justify-center w-full p-6">
        <Spinner />
      </div>
    );
  }

  if (!prescriptions?.length) {
    return (
      <div className="text-center w-full p-6 text-muted-foreground">
        No medications found.
      </div>
    );
  }

  // Find the most recent prescription
  const latestPrescription = prescriptions[0];
  const doctorName = latestPrescription.doctor_name || 'Your Doctor';
  const prescriptionDate = latestPrescription.prescription_date 
    ? format(new Date(latestPrescription.prescription_date), 'MMMM d, yyyy')
    : '';

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-amber-700">Prescribed Medications</h2>
        <p className="text-muted-foreground">
          Updated by {doctorName} on {prescriptionDate}
        </p>
      </div>

      <div className="space-y-4">
        {/* Example medications based on the mockup */}
        <Card className="overflow-hidden border border-gray-200">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-amber-700">Lisinopril 10mg</h3>
              <p className="text-muted-foreground">For blood pressure management</p>
            </div>
            <div className="text-right">
              <p className="font-medium">1 tablet</p>
              <p className="text-sm text-muted-foreground">Once daily, morning</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-gray-200">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-amber-700">Vitamin D3 1000 IU</h3>
              <p className="text-muted-foreground">Supplement</p>
            </div>
            <div className="text-right">
              <p className="font-medium">1 tablet</p>
              <p className="text-sm text-muted-foreground">Once daily, with food</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
