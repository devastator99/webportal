
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Save, Eye, Plus, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

  // Fetch all patients using the RPC function
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["all_patients_rpc"],
    queryFn: async () => {
      if (!user?.id) {
        console.error("No authenticated doctor user found");
        return [];
      }

      console.log("Fetching all patients using RPC function");
      
      // Use the get_users_by_role RPC function to get patient user_ids
      const { data: patientUserIds, error: rpcError } = await supabase
        .rpc('get_users_by_role', { role_name: 'patient' });
      
      if (rpcError) {
        console.error("Error fetching patient user IDs via RPC:", rpcError);
        throw rpcError;
      }
      
      console.log("Patient user IDs found via RPC:", patientUserIds?.length || 0);
      
      if (!patientUserIds?.length) {
        return [];
      }
      
      // Get all patient profiles in a single query with an IN clause
      // This is more efficient than fetching them one by one
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
      return profiles || [];
    },
  });

  // Fetch patient's past prescriptions when a patient is selected
  const { data: pastPrescriptions, refetch: refetchPrescriptions } = useQuery({
    queryKey: ["patient_prescriptions", selectedPatient, user?.id],
    queryFn: async () => {
      if (!selectedPatient || !user?.id) {
        console.log("Missing required IDs for prescription fetch:", { 
          selectedPatient, 
          doctorId: user?.id 
        });
        return [];
      }
      
      console.log("Fetching prescriptions for patient:", selectedPatient, "by doctor:", user.id);
      
      // First fetch the medical records - here we fetch records where the authenticated doctor is the creator
      // This ensures doctors only see prescriptions they created
      const { data: medicalRecords, error: medicalRecordsError } = await supabase
        .from("medical_records")
        .select(`
          id, 
          created_at, 
          diagnosis, 
          prescription, 
          notes,
          doctor_id
        `)
        .eq("patient_id", selectedPatient)
        .eq("doctor_id", user.id)
        .order("created_at", { ascending: false });

      if (medicalRecordsError) {
        console.error("Error fetching medical records:", medicalRecordsError);
        throw medicalRecordsError;
      }
      
      console.log("Medical records found for this doctor-patient pair:", medicalRecords?.length || 0);
      
      // If no records found, return empty array
      if (!medicalRecords?.length) {
        return [];
      }
      
      // Get all unique doctor IDs from the records
      const doctorIds = [...new Set(medicalRecords.map(record => record.doctor_id))];
      
      // Fetch doctor profiles in a separate query
      const { data: doctorProfiles, error: doctorProfilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", doctorIds);
        
      if (doctorProfilesError) {
        console.error("Error fetching doctor profiles:", doctorProfilesError);
        throw doctorProfilesError;
      }
      
      // Create a map of doctor IDs to doctor names for quick lookup
      const doctorsMap = doctorProfiles?.reduce((acc, doctor) => {
        acc[doctor.id] = {
          first_name: doctor.first_name || "Unknown",
          last_name: doctor.last_name || ""
        };
        return acc;
      }, {}) || {};
      
      // Combine the data
      return medicalRecords.map(record => ({
        id: record.id,
        created_at: record.created_at,
        diagnosis: record.diagnosis,
        prescription: record.prescription,
        notes: record.notes,
        doctor_id: record.doctor_id,
        doctor: doctorsMap[record.doctor_id] || { first_name: "Unknown", last_name: "" }
      }));
    },
    enabled: !!selectedPatient && !!user?.id,
  });

  const handleSavePrescription = async () => {
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

    try {
      if (!user?.id) {
        throw new Error("Doctor ID not available. Please try again later.");
      }
      
      console.log("Saving prescription for patient:", selectedPatient, "by doctor:", user.id);
      
      const { data, error } = await supabase
        .from("medical_records")
        .insert({
          patient_id: selectedPatient,
          doctor_id: user?.id,
          diagnosis,
          prescription,
          notes,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving prescription:', error);
        throw error;
      }

      console.log("Prescription saved successfully:", data);

      toast({
        title: "Success",
        description: "Prescription saved successfully",
      });

      // Refetch prescriptions to update the list
      refetchPrescriptions();

      // Reset form
      setDiagnosis("");
      setPrescription("");
      setNotes("");

    } catch (error: any) {
      console.error('Error saving prescription:', error);
      toast({
        title: "Error",
        description: `Failed to save prescription: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  // Filter patients based on search term
  const filteredPatients = patients?.filter((patient) => {
    if (!searchTerm) return true;
    
    const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const selectedPatientName = React.useMemo(() => {
    if (!selectedPatient || !patients) return "Select patient";
    
    const patient = patients.find(p => p.id === selectedPatient);
    if (!patient) return "Select patient";
    
    return `${patient.first_name || ""} ${patient.last_name || ""}`;
  }, [selectedPatient, patients]);

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
          
          {/* Searchable Patient Dropdown */}
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
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search patients..." 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandEmpty>No patient found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {isLoadingPatients ? (
                    <CommandItem disabled>Loading patients...</CommandItem>
                  ) : filteredPatients && filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                      <CommandItem
                        key={patient.id}
                        value={patient.id}
                        onSelect={(value) => {
                          setSelectedPatient(value);
                          setPatientSearchOpen(false);
                          // Reset the form when changing patients in write mode
                          if (activeTab === "write") {
                            setDiagnosis("");
                            setPrescription("");
                            setNotes("");
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2 w-full",
                          selectedPatient === patient.id ? "bg-accent" : ""
                        )}
                      >
                        {patient.first_name || "Unknown"} {patient.last_name || ""}
                      </CommandItem>
                    ))
                  ) : (
                    <CommandItem disabled>No patients found</CommandItem>
                  )}
                </CommandGroup>
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
                onClick={handleSavePrescription}
              >
                <Save className="h-4 w-4" />
                Save Prescription
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
      </CardContent>
    </Card>
  );
};
