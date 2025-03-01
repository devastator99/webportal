
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Save, Eye, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PrescriptionWriter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPatient, setSelectedPatient] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("write");

  // Fetch all patients using a different approach that bypasses the RLS policies
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["all_patients_rpc"],
    queryFn: async () => {
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
      
      // Get the patient profiles one by one to avoid IN clause with large arrays
      const patientProfiles = [];
      for (const item of patientUserIds) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .eq("id", item.user_id)
          .single();
          
        if (profileError) {
          console.error(`Error fetching profile for ${item.user_id}:`, profileError);
          continue; // Skip this profile but continue with others
        }
        
        if (profile) {
          patientProfiles.push(profile);
        }
      }
      
      console.log("Patient profiles found:", patientProfiles.length);
      return patientProfiles;
    },
  });

  // Fetch patient's past prescriptions when a patient is selected
  const { data: pastPrescriptions, refetch: refetchPrescriptions } = useQuery({
    queryKey: ["patient_prescriptions", selectedPatient],
    queryFn: async () => {
      if (!selectedPatient) return [];
      
      // Fix: Update the query to properly join the doctors' profiles
      const { data, error } = await supabase
        .from("medical_records")
        .select(`
          id, 
          created_at, 
          diagnosis, 
          prescription, 
          doctor_id
        `)
        .eq("patient_id", selectedPatient)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Now get the doctor information for each record
      const enhancedData = await Promise.all(
        data.map(async (record) => {
          if (record.doctor_id) {
            const { data: doctorData, error: doctorError } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", record.doctor_id)
              .single();
            
            if (!doctorError && doctorData) {
              return {
                ...record,
                doctor: {
                  first_name: doctorData.first_name,
                  last_name: doctorData.last_name
                }
              };
            }
          }
          
          return {
            ...record,
            doctor: {
              first_name: "Unknown",
              last_name: ""
            }
          };
        })
      );

      return enhancedData;
    },
    enabled: !!selectedPatient,
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

    try {
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

      if (error) throw error;

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
        description: "Failed to save prescription",
        variant: "destructive",
      });
    }
  };

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
          <Label htmlFor="patient">Select Patient</Label>
          <Select
            value={selectedPatient}
            onValueChange={(value) => {
              setSelectedPatient(value);
              // Reset the form when changing patients
              if (activeTab === "write") {
                setDiagnosis("");
                setPrescription("");
                setNotes("");
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select patient" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingPatients ? (
                <SelectItem value="loading" disabled>Loading patients...</SelectItem>
              ) : patients && patients.length > 0 ? (
                patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.first_name || "Unknown"} {patient.last_name || ""}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No patients found</SelectItem>
              )}
            </SelectContent>
          </Select>
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
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prescription">Prescription</Label>
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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Prescription</TableHead>
                        <TableHead>Doctor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastPrescriptions.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(new Date(record.created_at), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{record.diagnosis}</TableCell>
                          <TableCell className="max-w-md truncate">{record.prescription}</TableCell>
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
                  No prescriptions found for this patient
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
