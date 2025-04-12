
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, FileText, Download, Printer } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import html2pdf from 'html2pdf.js';
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define the prescription type
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
  const [activeTab, setActiveTab] = useState<string>('card');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Function to fetch patient prescriptions safely, avoiding RLS recursion
  const fetchPatientPrescriptions = async () => {
    if (!user) {
      return [];
    }
    
    try {
      console.log("Fetching prescriptions for patient:", user.id);
      
      // Get medical records first
      const { data: records, error: recordsError } = await supabase
        .from('medical_records')
        .select(`
          id,
          created_at,
          patient_id,
          doctor_id,
          diagnosis,
          prescription,
          notes
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });
      
      if (recordsError) {
        console.error("Error fetching medical records:", recordsError);
        throw recordsError;
      }
      
      // Early return if no records
      if (!records || records.length === 0) {
        return [];
      }
      
      // Get doctor profiles separately to avoid RLS recursion
      const doctorIds = [...new Set(records.map(record => record.doctor_id))];
      
      const { data: doctorProfiles, error: doctorError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', doctorIds);
      
      if (doctorError) {
        console.error("Error fetching doctor profiles:", doctorError);
      }
      
      // Create a doctor lookup map
      const doctorMap = (doctorProfiles || []).reduce((map, doctor) => {
        map[doctor.id] = doctor;
        return map;
      }, {} as Record<string, any>);
      
      // Transform the data to match our Prescription interface
      const transformedData = records.map(item => ({
        id: item.id,
        created_at: item.created_at,
        diagnosis: item.diagnosis,
        prescription: item.prescription,
        notes: item.notes || '',
        doctor_id: item.doctor_id,
        doctor_first_name: doctorMap[item.doctor_id]?.first_name || 'Unknown',
        doctor_last_name: doctorMap[item.doctor_id]?.last_name || 'Doctor',
        patient_id: item.patient_id
      }));
      
      console.log(`Processed ${transformedData.length} prescriptions for patient ${user.id}`);
      return transformedData as Prescription[];
    } catch (error) {
      console.error("Error in prescription fetching:", error);
      throw error;
    }
  };

  // Use React Query to fetch and cache prescriptions
  const { data: prescriptions, isLoading, error } = useQuery({
    queryKey: ['patientPrescriptions', user?.id],
    queryFn: fetchPatientPrescriptions,
    retry: 2,
    retryDelay: 1000
  });

  const generatePdf = async (prescription: Prescription) => {
    try {
      const element = document.getElementById('prescription-pdf-content');
      if (!element) {
        toast({
          title: "Error",
          description: "Could not find prescription content to print",
          variant: "destructive",
        });
        return;
      }
      
      setPdfGenerating(true);
      
      const opt = {
        margin: 10,
        filename: `Prescription_${prescription.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().from(element).set(opt).save();
      
      toast({
        title: "Success",
        description: "Prescription PDF has been generated and downloaded",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "There was a problem generating the PDF",
        variant: "destructive",
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/dashboard');
  };

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Prescriptions</h1>
          <Button variant="outline" onClick={handleBack}>Back to Dashboard</Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Error Loading Prescriptions</h3>
              <p className="text-gray-500 mb-4 text-center">
                There was an error loading your prescriptions. Please try again later.
              </p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Prescriptions</h1>
          <Button variant="outline" onClick={handleBack}>Back to Dashboard</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Prescriptions</h1>
        <Button variant="outline" onClick={handleBack}>Back to Dashboard</Button>
      </div>
      
      {/* Hidden div for PDF generation */}
      {selectedPrescription && (
        <div id="prescription-pdf-content" className="hidden">
          <div className="p-8 max-w-4xl mx-auto bg-white">
            <div className="flex justify-between items-start mb-8 border-b pb-4">
              <div>
                <h1 className="text-3xl font-bold text-[#9b87f5] mb-1">Anoobhooti Healthcare</h1>
                <p className="text-gray-500">Your Health, Our Priority</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-lg mb-1">Prescription</p>
                <p>Date: {format(new Date(selectedPrescription.created_at), "MMMM d, yyyy")}</p>
                <p>ID: {selectedPrescription.id.substring(0, 8)}</p>
              </div>
            </div>
            
            <div className="mb-8 grid grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Doctor</h2>
                <p className="font-medium">Dr. {selectedPrescription.doctor_first_name} {selectedPrescription.doctor_last_name}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Patient</h2>
                <p className="font-medium">{user?.user_metadata?.first_name} {user?.user_metadata?.last_name}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 border-b pb-1">Diagnosis</h2>
              <p className="whitespace-pre-line">{selectedPrescription.diagnosis}</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 border-b pb-1">Prescription</h2>
              <p className="whitespace-pre-line">{selectedPrescription.prescription}</p>
            </div>
            
            {selectedPrescription.notes && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3 border-b pb-1">Notes</h2>
                <p className="whitespace-pre-line">{selectedPrescription.notes}</p>
              </div>
            )}
            
            <div className="mt-16 pt-8 border-t">
              <div className="text-right">
                <p className="font-semibold">Dr. {selectedPrescription.doctor_first_name} {selectedPrescription.doctor_last_name}</p>
                <p className="text-gray-500 mt-1">Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      {(!prescriptions || prescriptions.length === 0) ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Prescriptions Yet</h3>
              <p className="text-gray-500 mb-4 text-center">
                You don't have any prescriptions yet. They will appear here after your doctor creates them.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="card" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="card">Card View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="card">
              <Card>
                <CardHeader>
                  <CardTitle>Prescription History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {prescriptions.map((prescription) => (
                      <div key={prescription.id} className="border rounded-lg p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src="/placeholder.svg" alt="Doctor" />
                              <AvatarFallback>
                                {prescription.doctor_first_name?.[0]}{prescription.doctor_last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}</h3>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                {format(new Date(prescription.created_at), "MMMM d, yyyy")}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(prescription.created_at), "h:mm a")}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Diagnosis</h4>
                            <p className="text-sm line-clamp-2">{prescription.diagnosis}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Prescription</h4>
                            <p className="text-sm line-clamp-3 whitespace-pre-line">{prescription.prescription}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPrescription(prescription);
                              generatePdf(prescription);
                            }}
                            disabled={pdfGenerating}
                          >
                            {pdfGenerating ? (
                              <>Generating...</>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-1" />
                                Download PDF
                              </>
                            )}
                          </Button>
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
                  <CardTitle>Prescription History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescriptions.map((prescription) => (
                        <TableRow key={prescription.id}>
                          <TableCell className="font-medium">
                            {format(new Date(prescription.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
                          </TableCell>
                          <TableCell className="max-w-[250px] truncate">
                            {prescription.diagnosis}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPrescription(prescription);
                                generatePdf(prescription);
                              }}
                              disabled={pdfGenerating}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              <span>PDF</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default PatientPrescriptionsPage;
