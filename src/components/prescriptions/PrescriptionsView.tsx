
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PrescriptionTabsViewer } from './PrescriptionTabsViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, Share2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { generatePdfFromElement } from '@/utils/pdfUtils';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveText } from '@/components/ui/responsive-typography';

export const PrescriptionsView = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  
  // Check if the current user is viewing their own prescriptions or if they have permission
  const effectivePatientId = patientId || user?.id;
  const isOwnPrescription = user?.id === effectivePatientId;
  const canEdit = userRole === 'doctor' || userRole === 'administrator';
  const isNutritionist = userRole === 'nutritionist';
  
  // Fetch patient info
  const { data: patient, isLoading: isLoadingPatient } = useQuery({
    queryKey: ['patient_profile', effectivePatientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', effectivePatientId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!effectivePatientId,
  });
  
  // Fetch patient care team information
  const { data: careTeam, isLoading: isLoadingCareTeam } = useQuery({
    queryKey: ['patient_care_team', effectivePatientId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_patient_care_team', {
        p_patient_id: effectivePatientId
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!effectivePatientId,
  });
  
  useEffect(() => {
    if (patient) {
      setPatientInfo(patient);
    }
    
    if (careTeam && Array.isArray(careTeam)) {
      const doctor = careTeam.find(member => member.role === 'doctor');
      if (doctor) {
        setDoctorInfo(doctor);
      }
    }
  }, [patient, careTeam]);
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownloadPdf = async () => {
    try {
      const filename = `prescription_${patientInfo?.first_name || ''}_${patientInfo?.last_name || ''}_${format(new Date(), 'yyyy-MM-dd')}`;
      await generatePdfFromElement('prescription-content', filename);
      toast({
        title: "Success",
        description: "Prescription PDF has been downloaded"
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };
  
  const handleShare = async () => {
    toast({
      description: "Share functionality would be implemented here"
    });
  };
  
  if (isLoadingPatient || isLoadingCareTeam) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!patientInfo) {
    return (
      <Card className="border-destructive w-full">
        <CardHeader>
          <CardTitle>Patient Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The requested patient information could not be found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-4 sm:py-6">
      {/* Patient Info Banner */}
      <Card className="w-full bg-white/70 backdrop-blur-sm border-0 shadow-sm glass-card-soft mb-4">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 sm:gap-4">
            <div>
              <ResponsiveText 
                as="h2" 
                mobileSize="base" 
                tabletSize="lg" 
                desktopSize="xl" 
                weight="semibold" 
                className="mb-0.5"
              >
                {patientInfo.first_name} {patientInfo.last_name}'s Prescriptions
              </ResponsiveText>
              {doctorInfo && (
                <p className="text-xs text-muted-foreground">
                  Assigned Doctor: Dr. {doctorInfo.first_name} {doctorInfo.last_name}
                </p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="px-2 py-0.5 text-xs">
                {isOwnPrescription ? "Your Prescriptions" : "Patient's Prescriptions"}
              </Badge>
              
              {userRole && (
                <Badge variant="secondary" className="px-2 py-0.5 text-xs capitalize">
                  {userRole}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content */}
      <div id="prescription-content" className="w-full">
        {effectivePatientId && <PrescriptionTabsViewer patientId={effectivePatientId} className="w-full mb-4" />}
      </div>
      
      {/* Action Buttons */}
      <div className="w-full flex flex-wrap justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" className="h-8 text-xs px-2.5">
          <Printer className="h-3 w-3 mr-1.5" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="h-8 text-xs px-2.5">
          <Download className="h-3 w-3 mr-1.5" />
          Download
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} className="h-8 text-xs px-2.5">
          <Share2 className="h-3 w-3 mr-1.5" />
          Share
        </Button>
        
        {canEdit && (
          <Button size="sm" className="h-8 text-xs px-2.5 bg-[#9b87f5]/90 hover:bg-[#7E69AB]">
            Edit Prescription
          </Button>
        )}
        
        {isNutritionist && (
          <Button size="sm" className="h-8 text-xs px-2.5 bg-[#9b87f5]/90 hover:bg-[#7E69AB]">
            Update Diet Plan
          </Button>
        )}
      </div>
    </div>
  );
};
