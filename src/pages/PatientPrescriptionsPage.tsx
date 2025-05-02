import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { FileText, Download, Calendar, User, Pill } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import html2pdf from 'html2pdf.js';
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useBreakpoint } from "@/hooks/use-responsive";
import { DashboardResponsiveLayout, DashboardResponsiveSection } from "@/components/layout/DashboardResponsiveLayout";
import { PatientHeader } from "@/components/dashboard/patient/PatientHeader";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { useIsMobileOrIPad } from "@/hooks/use-mobile";

interface Prescription {
  id: string;
  created_at: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  doctor_id: string;
  doctor_first_name: string;
  doctor_last_name: string;
}

// Helper function to safely format dates
const safeFormatDate = (dateString: string, formatStr: string = 'PPP') => {
  try {
    return format(parseISO(dateString), formatStr);
  } catch (e) {
    console.error("Date formatting error:", e, "for date:", dateString);
    return "Invalid date";
  }
};

// Helper function to safely calculate relative time
const safeFormatRelativeTime = (dateString: string) => {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch (e) {
    console.error("Relative time calculation error:", e, "for date:", dateString);
    return "";
  }
};

const PatientPrescriptionsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const { isTablet, isMobile } = useResponsive();
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const [manualError, setManualError] = useState<Error | null>(null);
  const isMobileOrTablet = useIsMobileOrIPad();
  
  // Effect to check if component is rendered
  useEffect(() => {
    console.log("PatientPrescriptionsPage mounted");
    return () => {
      console.log("PatientPrescriptionsPage unmounted");
    };
  }, []);
  
  // Directly try fetching data to debug
  useEffect(() => {
    if (user?.id) {
      const fetchDirectly = async () => {
        try {
          console.log("Directly fetching prescriptions for user:", user.id);
          const { data, error } = await supabase
            .rpc("get_all_patient_prescriptions", {
              p_patient_id: user.id
            });
          
          if (error) {
            console.error("Direct fetch error:", error);
            setManualError(new Error(`Direct fetch error: ${error.message}`));
          } else {
            console.log("Direct fetch success, found:", data?.length || 0, "prescriptions");
            if (data && data.length > 0) {
              console.log("Sample data:", data[0]);
              // Log the date format to help debug
              console.log("Date format example:", data[0].created_at);
            }
          }
        } catch (err) {
          console.error("Direct fetch exception:", err);
        }
      };
      
      fetchDirectly();
    }
  }, [user?.id]);
  
  const { data: prescriptions, isLoading, error } = useQuery({
    queryKey: ["patient_prescriptions", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.error("User not authenticated in prescription page");
        throw new Error("User not authenticated");
      }
      
      console.log("Fetching prescriptions for user:", user.id);
      
      // Use the RPC function to get all prescriptions
      const { data, error } = await supabase
        .rpc("get_all_patient_prescriptions", {
          p_patient_id: user.id
        });
      
      if (error) {
        console.error("Error fetching prescriptions:", error);
        throw error;
      }
      
      console.log("Prescriptions fetched successfully:", data?.length || 0);
      if (data && data.length > 0) {
        console.log("First prescription sample:", data[0]);
      } else {
        console.log("No prescriptions found");
      }
      
      return data as Prescription[];
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 30000
  });
  
  const generatePdf = async (prescription: Prescription) => {
    try {
      const element = document.getElementById('prescription-pdf-content');
      if (!element) return;
      
      const opt = {
        margin: 10,
        filename: `prescription-${prescription.id.slice(0, 8)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
      
      toast({
        title: "PDF Generated",
        description: "Your prescription PDF has been generated successfully.",
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your prescription PDF.",
        variant: "destructive"
      });
    }
  };

  const openPdfPreview = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setPdfPreviewOpen(true);
  };

  if (isLoading) {
    return (
      <>
        <PatientHeader />
        <DashboardResponsiveLayout>
          <div className="flex justify-center items-center h-[60vh]">
            <Spinner size="lg" />
          </div>
        </DashboardResponsiveLayout>
        {isMobileOrTablet && <MobileNavigation />}
      </>
    );
  }

  if (error || manualError) {
    const displayError = error || manualError;
    console.error("Prescription error details:", displayError);
    return (
      <>
        <PatientHeader />
        <DashboardResponsiveLayout>
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <p>There was an error loading your prescriptions. Please try again later.</p>
              <p className="text-sm text-muted-foreground mt-2">{(displayError as Error).message}</p>
              <Button 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </DashboardResponsiveLayout>
        {isMobileOrTablet && <MobileNavigation />}
      </>
    );
  }

  return (
    <>
      <PatientHeader />
      <DashboardResponsiveLayout>
        <DashboardResponsiveSection
          title="My Prescriptions"
          description="View and download your prescriptions from your doctors."
        >
          {(!prescriptions || prescriptions.length === 0) ? (
            <Card>
              <CardHeader>
                <CardTitle>No Prescriptions Found</CardTitle>
                <CardDescription>
                  You don't have any prescriptions yet. Once your doctor writes a prescription, it will appear here.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Tabs defaultValue="list" className="w-full">
              <TabsList className={`mb-4 ${isSmallScreen || isMobile ? 'w-full grid grid-cols-2' : ''}`}>
                <TabsTrigger value="list" className={isSmallScreen || isMobile ? 'w-full' : ''}>List View</TabsTrigger>
                <TabsTrigger value="timeline" className={isSmallScreen || isMobile ? 'w-full' : ''}>Timeline</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list">
                <div className="grid gap-4">
                  {prescriptions.map((prescription) => (
                    <Card key={prescription.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                          <div>
                            <CardTitle className="text-lg">
                              Prescription
                            </CardTitle>
                            <CardDescription>
                              {safeFormatDate(prescription.created_at, 'PPP')} by Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="mt-2 md:mt-0 w-fit">
                            {safeFormatRelativeTime(prescription.created_at)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium text-sm flex items-center gap-2 mb-1">
                              <Pill className="h-4 w-4 text-blue-500" />
                              Diagnosis
                            </h3>
                            <p className="text-sm">{prescription.diagnosis || "No diagnosis provided"}</p>
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-sm flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-green-500" />
                              Prescription
                            </h3>
                            <p className="text-sm whitespace-pre-wrap">{prescription.prescription || "No specific medications prescribed"}</p>
                          </div>
                          
                          {prescription.notes && (
                            <div>
                              <h3 className="font-medium text-sm flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-purple-500" />
                                Notes
                              </h3>
                              <p className="text-sm whitespace-pre-wrap">{prescription.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <div className={`px-6 py-4 bg-muted/20 flex ${isSmallScreen || isMobile || isTablet ? 'flex-col space-y-2' : 'justify-end space-x-2'}`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openPdfPreview(prescription)}
                          className={isSmallScreen || isMobile || isTablet ? 'w-full' : ''}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          PDF Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPrescription(prescription);
                            generatePdf(prescription);
                          }}
                          className={isSmallScreen || isMobile || isTablet ? 'w-full' : ''}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="timeline">
                <Card>
                  <CardHeader>
                    <CardTitle>Prescription Timeline</CardTitle>
                    <CardDescription>View your prescription history over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-border">
                      {prescriptions.map((prescription) => (
                        <div key={prescription.id} className="relative pl-8">
                          <div className="absolute left-0 top-0 bg-primary rounded-full w-10 h-10 flex items-center justify-center text-white">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="pt-2">
                            <div className="font-semibold text-md mb-1">
                              Prescription from Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
                            </div>
                            <time className="block text-xs text-gray-500 mb-2">
                              {safeFormatDate(prescription.created_at)} 
                            </time>
                            <div className="text-sm">
                              <strong>Diagnosis:</strong> {prescription.diagnosis || "No diagnosis provided"}
                            </div>
                            <div className={`mt-2 flex ${isSmallScreen || isMobile || isTablet ? 'flex-col space-y-2' : 'flex-row space-x-2'}`}>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openPdfPreview(prescription)}
                                className={isSmallScreen || isMobile || isTablet ? 'w-full' : ''}
                              >
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setSelectedPrescription(prescription);
                                  generatePdf(prescription);
                                }}
                                className={isSmallScreen || isMobile || isTablet ? 'w-full' : ''}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DashboardResponsiveSection>
        
        {/* PDF Preview Dialog */}
        <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
          <DialogContent className={`sm:max-w-[800px] ${isSmallScreen || isMobile ? 'w-[95vw] p-3' : isTablet || isMediumScreen ? 'w-[90vw] max-h-[80vh]' : ''}`}>
            <DialogHeader>
              <DialogTitle>Prescription PDF Preview</DialogTitle>
            </DialogHeader>
            {selectedPrescription && (
              <div className={`${isTablet || isMediumScreen ? 'max-h-[60vh]' : 'max-h-[70vh]'} overflow-y-auto`}>
                <div id="prescription-pdf-content" className="p-8 bg-white">
                  <div className="text-center mb-6">
                    <h1 className="text-xl font-bold mb-2">Medical Prescription</h1>
                    <p className="text-sm text-gray-500">
                      Issued on: {safeFormatDate(selectedPrescription.created_at)}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="font-bold text-sm">Doctor</h3>
                      <p>Dr. {selectedPrescription.doctor_first_name} {selectedPrescription.doctor_last_name}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Patient</h3>
                      <p>{user?.user_metadata?.first_name} {user?.user_metadata?.last_name}</p>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold">Diagnosis</h3>
                      <p>{selectedPrescription.diagnosis || "No diagnosis provided"}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-bold">Prescription</h3>
                      <p className="whitespace-pre-wrap">{selectedPrescription.prescription || "No specific medications prescribed"}</p>
                    </div>
                    
                    {selectedPrescription.notes && (
                      <div>
                        <h3 className="font-bold">Additional Notes</h3>
                        <p className="whitespace-pre-wrap">{selectedPrescription.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-8 pt-4 border-t text-xs text-gray-500">
                    <p>This prescription is valid from {safeFormatDate(selectedPrescription.created_at)}</p>
                    <p className="mt-2">Digitally issued via Anubhuti Care System</p>
                  </div>
                </div>
              </div>
            )}
            <div className={`flex ${isSmallScreen || isMobile || isTablet ? 'flex-col space-y-2' : 'justify-end space-x-2'}`}>
              <Button 
                variant="outline" 
                onClick={() => setPdfPreviewOpen(false)}
                className={isSmallScreen || isMobile || isTablet ? 'w-full' : ''}
              >
                Close
              </Button>
              <Button 
                onClick={() => selectedPrescription && generatePdf(selectedPrescription)}
                className={isSmallScreen || isMobile || isTablet ? 'w-full' : ''}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardResponsiveLayout>
      {isMobileOrTablet && <MobileNavigation />}
    </>
  );
};

export default PatientPrescriptionsPage;
