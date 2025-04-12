import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistance } from "date-fns";
import { FileText, Download, Calendar, User, Pill, Eye } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import html2pdf from 'html2pdf.js';
import { useIsIPad, useIsMobile } from "@/hooks/use-mobile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

interface Prescription {
  id: string;
  created_at: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  doctor_id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  patient_id: string;
}

const PatientPrescriptionsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const isIPad = useIsIPad();
  const isMobile = useIsMobile();

  const { data: prescriptions, isLoading, error, refetch } = useQuery({
    queryKey: ["patient_prescriptions", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      console.log("Fetching prescriptions for user:", user.id);
      
      try {
        // Use the RPC function we created
        const { data, error } = await supabase
          .rpc('get_patient_prescriptions', { p_patient_id: user.id });
        
        if (error) {
          console.error("Error fetching prescriptions:", error);
          throw error;
        }
        
        if (!data || !Array.isArray(data)) {
          console.error("Invalid prescription data format:", data);
          throw new Error("Invalid data format received from server");
        }
        
        console.log(`Fetched ${data.length} prescriptions for patient ${user.id}`);
        
        return data as Prescription[];
      } catch (error) {
        console.error("Error in prescription fetching:", error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000
  });
  
  const generatePdf = async (prescription: Prescription) => {
    try {
      const element = document.getElementById('prescription-pdf-content');
      if (!element) {
        toast({
          title: "PDF Generation Failed",
          description: "PDF content element not found",
          variant: "destructive"
        });
        return;
      }
      
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

  const containerClass = isMobile 
    ? "container pt-16 pb-8 px-2 prescription-page-container" 
    : isIPad 
      ? "container pt-16 pb-8 px-4 prescription-page-container" 
      : "container pt-16 pb-8 prescription-page-container";

  if (isLoading) {
    return (
      <div className={`${containerClass} flex items-center justify-center min-h-[50vh]`}>
        <LoadingSpinner size="lg" />
        <p className="ml-2 text-muted-foreground">Loading your prescriptions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClass}>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{(error as Error).message || "There was an error loading your prescriptions. Please try again later."}</p>
            <Button 
              onClick={() => refetch()}
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={containerClass}>
        <h1 className="text-2xl font-bold mb-4">My Prescriptions</h1>
        <p className="text-muted-foreground mb-8">
          View and download your prescriptions from your doctor.
        </p>

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
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className={`mb-4 ${isMobile ? 'w-full' : ''}`}>
              <TabsTrigger value="grid" className={isMobile ? 'flex-1' : ''}>Grid View</TabsTrigger>
              <TabsTrigger value="list" className={isMobile ? 'flex-1' : ''}>List View</TabsTrigger>
              <TabsTrigger value="timeline" className={isMobile ? 'flex-1' : ''}>Timeline</TabsTrigger>
              <TabsTrigger value="table" className={isMobile ? 'flex-1' : ''}>Table View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="grid">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prescriptions.map((prescription) => (
                  <Card key={prescription.id} className="h-full flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between items-start">
                        <span className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-purple-500" />
                          Prescription
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {formatDistance(new Date(prescription.created_at), new Date(), { addSuffix: true })}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {new Date(prescription.created_at).toLocaleDateString()}
                      </CardDescription>
                      <CardDescription>
                        Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex-grow">
                      <div>
                        <h3 className="font-medium text-sm flex items-center gap-2 mb-1">
                          <Pill className="h-4 w-4 text-blue-500" />
                          Diagnosis
                        </h3>
                        <p className="text-sm line-clamp-2">{prescription.diagnosis || "No diagnosis provided"}</p>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-2 flex justify-center gap-2">
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center gap-2"
                        onClick={() => openPdfPreview(prescription)}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      
                      <Button
                        variant="secondary"
                        className="w-full flex items-center gap-2"
                        onClick={() => {
                          setSelectedPrescription(prescription);
                          generatePdf(prescription);
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
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
                            {new Date(prescription.created_at).toLocaleDateString()} by Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="mt-2 md:mt-0 w-fit">
                          {formatDistance(new Date(prescription.created_at), new Date(), { addSuffix: true })}
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
                    <div className={`px-6 py-4 bg-muted/20 flex ${isMobile ? 'flex-col' : 'justify-end'} space-y-2 md:space-y-0 md:space-x-2`}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openPdfPreview(prescription)}
                        className={isMobile ? 'w-full' : ''}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View PDF
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPrescription(prescription);
                          generatePdf(prescription);
                        }}
                        className={isMobile ? 'w-full' : ''}
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
                            {new Date(prescription.created_at).toLocaleDateString()} at {new Date(prescription.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </time>
                          <div className="text-sm">
                            <strong>Diagnosis:</strong> {prescription.diagnosis || "No diagnosis provided"}
                          </div>
                          <div className={`mt-2 flex ${isMobile ? 'flex-col' : 'flex-row'} ${isMobile ? 'space-y-2' : 'space-x-2'}`}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openPdfPreview(prescription)}
                              className={isMobile ? 'w-full' : ''}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPrescription(prescription);
                                generatePdf(prescription);
                              }}
                              className={isMobile ? 'w-full' : ''}
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
            
            <TabsContent value="table">
              <Card>
                <CardHeader>
                  <CardTitle>Prescriptions Table</CardTitle>
                  <CardDescription>View all your prescriptions in a tabular format</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Diagnosis</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prescriptions.map((prescription) => (
                          <TableRow key={prescription.id}>
                            <TableCell>{new Date(prescription.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}</TableCell>
                            <TableCell className="max-w-xs truncate">{prescription.diagnosis || "No diagnosis provided"}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openPdfPreview(prescription)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPrescription(prescription);
                                    generatePdf(prescription);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
        
        <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
          <DialogContent className={`sm:max-w-[800px] ${isMobile ? 'w-[95vw] p-3' : ''}`}>
            <DialogHeader>
              <DialogTitle>Prescription PDF Preview</DialogTitle>
            </DialogHeader>
            {selectedPrescription && (
              <div className="max-h-[70vh] overflow-y-auto">
                <div id="prescription-pdf-content" className="p-8 bg-white">
                  <div className="text-center mb-6">
                    <h1 className="text-xl font-bold mb-2">Medical Prescription</h1>
                    <p className="text-sm text-gray-500">
                      Issued on: {new Date(selectedPrescription.created_at).toLocaleDateString()}
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
                    <p>This prescription is valid from {new Date(selectedPrescription.created_at).toLocaleDateString()}</p>
                    <p className="mt-2">Digitally issued via Anubhuti Care System</p>
                  </div>
                </div>
              </div>
            )}
            <div className={`flex ${isMobile ? 'flex-col' : 'justify-end'} space-y-2 md:space-y-0 md:space-x-2`}>
              <Button 
                variant="outline" 
                onClick={() => setPdfPreviewOpen(false)}
                className={isMobile ? 'w-full' : ''}
              >
                Close
              </Button>
              <Button 
                onClick={() => selectedPrescription && generatePdf(selectedPrescription)}
                className={isMobile ? 'w-full' : ''}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default PatientPrescriptionsPage;
