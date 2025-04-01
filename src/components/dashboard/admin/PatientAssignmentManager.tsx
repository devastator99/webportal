
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export const PatientAssignmentManager = () => {
  const { toast } = useToast();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedNutritionist, setSelectedNutritionist] = useState<string>("");
  
  // Query for all patients
  const { data: patients } = useQuery({
    queryKey: ["all_patients"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_users_by_role", { 
        p_role: "patient" 
      });
      
      if (error) throw error;
      return data as Profile[];
    }
  });
  
  // Query for all doctors
  const { data: doctors } = useQuery({
    queryKey: ["all_doctors"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_users_by_role", { 
        p_role: "doctor" 
      });
      
      if (error) throw error;
      return data as Profile[];
    }
  });
  
  // Query for all nutritionists
  const { data: nutritionists } = useQuery({
    queryKey: ["all_nutritionists"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_users_by_role", { 
        p_role: "nutritionist" 
      });
      
      if (error) throw error;
      return data as Profile[];
    }
  });
  
  const handleAssignDoctor = async () => {
    if (!selectedPatient || !selectedDoctor) {
      toast({
        title: "Missing selection",
        description: "Please select both a patient and a doctor",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase.rpc("assign_doctor_to_patient", {
        p_doctor_id: selectedDoctor,
        p_patient_id: selectedPatient
      });
      
      if (error) throw error;
      
      toast({
        title: "Doctor assigned successfully",
        description: "The doctor has been assigned to the patient"
      });
    } catch (error: any) {
      console.error("Error assigning doctor:", error);
      toast({
        title: "Assignment failed",
        description: error.message || "An error occurred while assigning the doctor",
        variant: "destructive"
      });
    }
  };
  
  const handleAssignNutritionist = async () => {
    if (!selectedPatient || !selectedNutritionist) {
      toast({
        title: "Missing selection",
        description: "Please select both a patient and a nutritionist",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase.rpc("assign_nutritionist_to_patient", {
        p_nutritionist_id: selectedNutritionist,
        p_patient_id: selectedPatient
      });
      
      if (error) throw error;
      
      toast({
        title: "Nutritionist assigned successfully",
        description: "The nutritionist has been assigned to the patient"
      });
    } catch (error: any) {
      console.error("Error assigning nutritionist:", error);
      toast({
        title: "Assignment failed",
        description: error.message || "An error occurred while assigning the nutritionist",
        variant: "destructive"
      });
    }
  };
  
  const formatName = (profile: Profile) => {
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Assign Care Providers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Patient</label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger>
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients?.map(patient => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {formatName(patient)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Tabs defaultValue="doctor">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="doctor">Assign Doctor</TabsTrigger>
              <TabsTrigger value="nutritionist">Assign Nutritionist</TabsTrigger>
            </TabsList>
            
            <TabsContent value="doctor" className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Doctor</label>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors?.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {formatName(doctor)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleAssignDoctor} 
                disabled={!selectedPatient || !selectedDoctor}
                className="w-full"
              >
                Assign Doctor to Patient
              </Button>
            </TabsContent>
            
            <TabsContent value="nutritionist" className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Nutritionist</label>
                <Select value={selectedNutritionist} onValueChange={setSelectedNutritionist}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a nutritionist" />
                  </SelectTrigger>
                  <SelectContent>
                    {nutritionists?.map(nutritionist => (
                      <SelectItem key={nutritionist.id} value={nutritionist.id}>
                        {formatName(nutritionist)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleAssignNutritionist} 
                disabled={!selectedPatient || !selectedNutritionist}
                className="w-full"
              >
                Assign Nutritionist to Patient
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};
