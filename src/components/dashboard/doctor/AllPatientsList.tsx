
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, fetchPatientPrescriptions, getDoctorPatients } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Users, FileText, ClipboardList } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface Prescription {
  id: string;
  created_at: string;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
}

interface MedicalReport {
  id: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

export const AllPatientsList = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<"prescriptions" | "reports">("prescriptions");

  // Fetch all patients using our new RPC helper function
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["patients_for_doctor", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as Patient[];
      
      try {
        console.log("Fetching patients for doctor:", user.id);
        // Use our RPC helper function instead of direct query
        const result = await getDoctorPatients(user.id);
        return result as Patient[];
      } catch (error) {
        console.error("Error fetching patients:", error);
        toast({
          title: "Error",
          description: "Failed to load patients. Please try again.",
          variant: "destructive",
        });
        return [] as Patient[];
      }
    },
    enabled: !!user?.id,
  });

  // Fetch patient prescriptions using the helper function
  const { data: prescriptions, isLoading: isLoadingPrescriptions } = useQuery({
    queryKey: ["patient_prescriptions_view", selectedPatient?.id, user?.id],
    queryFn: async () => {
      if (!selectedPatient?.id || !user?.id) return [] as Prescription[];
      
      try {
        console.log("Fetching prescriptions for patient:", selectedPatient.id);
        const result = await fetchPatientPrescriptions(selectedPatient.id, user.id);
        return result as Prescription[];
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
        toast({
          title: "Error",
          description: "Failed to load prescriptions. Please try again.",
          variant: "destructive",
        });
        return [] as Prescription[];
      }
    },
    enabled: !!selectedPatient?.id && !!user?.id,
  });

  // Fetch patient medical reports
  const { data: medicalReports, isLoading: isLoadingReports } = useQuery({
    queryKey: ["patient_medical_reports", selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient?.id) return [] as MedicalReport[];
      
      try {
        console.log("Fetching medical reports for patient:", selectedPatient.id);
        
        const { data, error } = await supabase
          .rpc("get_patient_medical_reports", {
            p_patient_id: selectedPatient.id
          });
          
        if (error) {
          console.error("Error fetching medical reports:", error);
          throw error;
        }
        
        return data as MedicalReport[] || [];
      } catch (error) {
        console.error("Error fetching medical reports:", error);
        toast({
          title: "Error",
          description: "Failed to load medical reports. Please try again.",
          variant: "destructive",
        });
        return [] as MedicalReport[];
      }
    },
    enabled: !!selectedPatient?.id,
  });

  // Filter patients based on search term
  const filteredPatients = patients ? patients.filter(patient => {
    const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  }) : [];

  // Handle opening medical report
  const handleViewReport = async (reportId: string) => {
    try {
      const { data: url, error } = await supabase
        .rpc("get_signed_medical_report_url", {
          p_report_id: reportId
        });
        
      if (error) {
        throw error;
      }
      
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({
          title: "Error",
          description: "Could not generate URL for this file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error opening medical report:", error);
      toast({
        title: "Error",
        description: "Failed to open medical report",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>All Patients</CardTitle>
          </div>
          <CardDescription>
            View and manage your patient list, prescriptions, and medical reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left side: Patient list */}
            <div className="space-y-4">
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              
              <div className="border rounded-md divide-y max-h-[60vh] overflow-y-auto">
                {isLoadingPatients ? (
                  <div className="p-4 text-center">Loading patients...</div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchTerm ? "No matching patients found" : "No patients assigned yet"}
                  </div>
                ) : (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                        selectedPatient?.id === patient.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <div className="font-medium">
                        {patient.first_name} {patient.last_name}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Right side: Patient details */}
            <div className="md:col-span-2">
              {selectedPatient ? (
                <div>
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </h3>
                    <Separator className="my-2" />
                  </div>
                  
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="prescriptions" className="flex items-center gap-1">
                        <ClipboardList className="h-4 w-4" />
                        Prescriptions
                      </TabsTrigger>
                      <TabsTrigger value="reports" className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Medical Reports
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Prescriptions Tab */}
                    <TabsContent value="prescriptions">
                      {isLoadingPrescriptions ? (
                        <div className="text-center py-8">Loading prescriptions...</div>
                      ) : prescriptions && prescriptions.length > 0 ? (
                        <div className="space-y-4">
                          {prescriptions.map((prescription: Prescription) => (
                            <Card key={prescription.id}>
                              <CardHeader className="py-3">
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-base">
                                    {prescription.diagnosis || "No diagnosis"}
                                  </CardTitle>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(prescription.created_at)}
                                  </span>
                                </div>
                              </CardHeader>
                              <CardContent className="py-3">
                                <div className="space-y-2">
                                  {prescription.prescription && (
                                    <div>
                                      <h4 className="text-sm font-semibold">Prescription:</h4>
                                      <p className="text-sm whitespace-pre-wrap">
                                        {prescription.prescription}
                                      </p>
                                    </div>
                                  )}
                                  {prescription.notes && (
                                    <div>
                                      <h4 className="text-sm font-semibold">Notes:</h4>
                                      <p className="text-sm whitespace-pre-wrap">
                                        {prescription.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No prescriptions found for this patient by you
                        </div>
                      )}
                    </TabsContent>
                    
                    {/* Medical Reports Tab */}
                    <TabsContent value="reports">
                      {isLoadingReports ? (
                        <div className="text-center py-8">Loading medical reports...</div>
                      ) : medicalReports && medicalReports.length > 0 ? (
                        <div className="space-y-2">
                          {medicalReports.map((report: MedicalReport) => (
                            <Card key={report.id}>
                              <CardContent className="p-3 flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{report.file_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(report.uploaded_at)}
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewReport(report.id)}
                                >
                                  View
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No medical reports found for this patient
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Users className="mx-auto h-12 w-12 mb-2 opacity-30" />
                    <p>Select a patient to view their details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
