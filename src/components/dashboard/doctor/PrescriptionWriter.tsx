
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Save, Eye, Plus, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase, asArray, safeGet } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { 
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList 
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

// Define interfaces for our data structures
interface PatientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface DoctorProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface MedicalRecord {
  id: string;
  created_at: string;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
  doctor_id: string;
  doctor?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export const PrescriptionWriter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPatient, setSelectedPatient] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("write");
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePrescriptionRequest = () => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive",
      });
      return;
    }

    if (!diagnosis.trim()) {
      toast({
        title: "Error",
        description: "Please enter a diagnosis",
        variant: "destructive",
      });
      return;
    }

    if (!prescription.trim()) {
      toast({
        title: "Error",
        description: "Please enter prescription details",
        variant: "destructive",
      });
      return;
    }

    setConfirmDialogOpen(true);
  };

  // Fetch all patients
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["all_patients_rpc"],
    queryFn: async () => {
      if (!user?.id) {
        console.error("No authenticated doctor user found");
        return [];
      }

      console.log("Fetching all patients using RPC function");
      
      const { data: patientUserIds, error: rpcError } = await supabase
        .rpc('get_users_by_role', { role_name: 'patient' });
      
      if (rpcError) {
        console.error("Error fetching patient user IDs via RPC:", rpcError);
        throw rpcError;
      }
      
      console.log("Patient user IDs found via RPC:", patientUserIds?.length || 0);
      
      if (!patientUserIds?.length) {
        return [] as PatientProfile[];
      }
      
      const patientIds = patientUserIds.map(item => item.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", patientIds);
        
      if (profilesError) {
        console.error("Error fetching patient profiles:", profilesError);
        throw profilesError;
      }
      
      console.log("Patient profiles found:", profiles?.length || 0);
      return (profiles || []) as PatientProfile[];
    },
  });

  // Fetch prescriptions for the selected patient
  const { data: pastPrescriptions, refetch: refetchPrescriptions } = useQuery({
    queryKey: ["patient_prescriptions", selectedPatient, user?.id],
    queryFn: async () => {
      if (!selectedPatient || !user?.id) {
        console.log("Missing required IDs for prescription fetch:", { 
          selectedPatient, 
          doctorId: user?.id 
        });
        return [] as MedicalRecord[];
      }
      
      console.log("Fetching prescriptions for patient:", selectedPatient, "by doctor:", user.id);
      
      // Directly query the medical_records table instead of using the RPC function
      const { data: medicalRecords, error: medicalRecordsError } = await supabase
        .from('medical_records')
        .select(`
          id,
          created_at,
          diagnosis,
          prescription,
          notes,
          doctor_id
        `)
        .eq('patient_id', selectedPatient)
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });

      if (medicalRecordsError) {
        console.error("Error fetching medical records:", medicalRecordsError);
        throw medicalRecordsError;
      }
      
      console.log("Medical records found:", medicalRecords?.length || 0);
      
      if (!medicalRecords?.length) {
        return [] as MedicalRecord[];
      }
      
      const { data: doctorProfile, error: doctorProfileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", user.id)
        .single();
        
      if (doctorProfileError) {
        console.error("Error fetching doctor profile:", doctorProfileError);
        // Continue without doctor info rather than failing completely
      }
      
      const doctorInfo = doctorProfile || { first_name: "Unknown", last_name: "" };
      
      return (medicalRecords || []).map(record => ({
        ...record,
        doctor: { 
          first_name: doctorInfo.first_name, 
          last_name: doctorInfo.last_name 
        }
      })) as MedicalRecord[];
    },
    enabled: !!selectedPatient && !!user?.id,
  });

  const handleSavePrescription = async () => {
    if (isSaving) return; 
    
    try {
      setIsSaving(true);
      
      if (!user?.id) {
        throw new Error("Doctor ID not available. Please try again later.");
      }
      
      console.log("Saving prescription for patient:", selectedPatient, "by doctor:", user.id);
      
      // Insert directly into the medical_records table
      const { data, error } = await supabase
        .from('medical_records')
        .insert([{
          patient_id: selectedPatient,
          doctor_id: user.id,
          diagnosis,
          prescription,
          notes
        }])
        .select();

      if (error) {
        console.error('Error saving prescription:', error);
        throw error;
      }

      console.log("Prescription saved successfully:", data);

      toast({
        title: "Success",
        description: "Prescription saved successfully",
      });

      setConfirmDialogOpen(false);
      
      // Clear the form fields
      setDiagnosis("");
      setPrescription("");
      setNotes("");
      
      // Refresh the prescriptions list
      await refetchPrescriptions();
      
      // Switch to the view tab
      setActiveTab("view");
      
    } catch (error: any) {
      console.error('Error saving prescription:', error);
      toast({
        title: "Error",
        description: `Failed to save prescription: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
      
    } finally {
      setIsSaving(false);
      setConfirmDialogOpen(false);
    }
  };

  const filteredPatients = React.useMemo(() => {
    if (!patients) return [];
    
    if (!searchTerm) return patients;
    
    return patients.filter((patient) => {
      const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [patients, searchTerm]);

  const selectedPatientName = React.useMemo(() => {
    if (!selectedPatient || !patients) return "Select patient";
    
    const patient = patients.find(p => p.id === selectedPatient);
    if (!patient) return "Select patient";
    
    return `${patient.first_name || ""} ${patient.last_name || ""}`;
  }, [selectedPatient, patients]);

  // Auto-select Jane Doe if available
  useEffect(() => {
    if (patients && patients.length > 0 && !selectedPatient) {
      const janePatient = patients.find(p => 
        (p.first_name?.toLowerCase() === 'jane' && p.last_name?.toLowerCase() === 'doe') ||
        ((p.first_name?.toLowerCase()?.includes('jane') || p.last_name?.toLowerCase()?.includes('doe')))
      );
      
      if (janePatient) {
        setSelectedPatient(janePatient.id);
        console.log("Found Jane Doe:", janePatient);
      }
    }
  }, [patients, selectedPatient]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Prescription Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="patient">Select Patient <span className="text-red-500">*</span></Label>
          
          <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={patientSearchOpen}
                className="w-full justify-between"
              >
                {selectedPatientName}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search patients..." 
                  onValueChange={setSearchTerm}
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>No patient found.</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-y-auto">
                    {isLoadingPatients ? (
                      <CommandItem disabled>Loading patients...</CommandItem>
                    ) : filteredPatients && filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <CommandItem
                          key={patient.id}
                          onSelect={() => {
                            setSelectedPatient(patient.id);
                            setPatientSearchOpen(false);
                            if (activeTab === "write") {
                              setDiagnosis("");
                              setPrescription("");
                              setNotes("");
                            }
                          }}
                        >
                          {patient.first_name || "Unknown"} {patient.last_name || ""}
                        </CommandItem>
                      ))
                    ) : (
                      <CommandItem disabled>No patients found</CommandItem>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedPatient && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="write" className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Write Prescription
              </TabsTrigger>
              <TabsTrigger value="view" className="flex items-center gap-2">
                <Eye className="h-4 w-4" /> View Prescriptions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="write" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis <span className="text-red-500">*</span></Label>
                <Input
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prescription">Prescription <span className="text-red-500">*</span></Label>
                <Textarea
                  id="prescription"
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder="Write prescription details"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes"
                />
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleSavePrescriptionRequest}
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Prescription"}
              </Button>
            </TabsContent>
            
            <TabsContent value="view" className="pt-4">
              {pastPrescriptions && pastPrescriptions.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Prescription</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Doctor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastPrescriptions.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(new Date(record.created_at), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{record.diagnosis}</TableCell>
                          <TableCell className="max-w-md whitespace-pre-wrap break-words">{record.prescription}</TableCell>
                          <TableCell className="max-w-xs whitespace-pre-wrap break-words">{record.notes || "-"}</TableCell>
                          <TableCell>
                            {record.doctor ? 
                              `${record.doctor.first_name} ${record.doctor.last_name}` : 
                              'Unknown'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No prescriptions found for this patient by you
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Prescription</DialogTitle>
              <DialogDescription>
                Are you sure you want to save this prescription? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">Diagnosis:</p>
                <p className="text-sm">{diagnosis}</p>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">Prescription:</p>
                <p className="text-sm whitespace-pre-wrap">{prescription}</p>
              </div>
              {notes && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">Notes:</p>
                  <p className="text-sm whitespace-pre-wrap">{notes}</p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSavePrescription}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Confirm & Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
