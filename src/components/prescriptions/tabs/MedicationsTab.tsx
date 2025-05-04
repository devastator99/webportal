
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Spinner } from '@/components/ui/spinner';
import { generatePdfFromElement } from '@/utils/pdfUtils';

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
        No prescriptions found.
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {prescriptions.map((prescription: any) => (
        <Card key={prescription.prescription_id} className="w-full bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">
                Prescription by Dr. {prescription.doctor_name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {format(new Date(prescription.prescription_date), 'PPP')}
              </p>
            </div>
            <Badge variant="outline">
              {prescription.format_type}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">Diagnosis</p>
              <p className="text-sm text-muted-foreground">{prescription.diagnosis}</p>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                View Details
              </Button>
              <Button 
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
