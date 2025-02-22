
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Save, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export const PrescriptionWriter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPatient, setSelectedPatient] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch assigned patients
  const { data: patients } = useQuery({
    queryKey: ["assigned_patients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_assignments")
        .select(`
          patient_id,
          patient:profiles!patient_assignments_patient_profile_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq("doctor_id", user?.id);

      if (error) throw error;
      return data;
    },
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

      // Reset form
      setSelectedPatient("");
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
          Write Prescription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient">Select Patient</Label>
            <Select
              value={selectedPatient}
              onValueChange={setSelectedPatient}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients?.map((p) => (
                  <SelectItem key={p.patient.id} value={p.patient.id}>
                    {p.patient.first_name} {p.patient.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
        </div>
      </CardContent>
    </Card>
  );
};
