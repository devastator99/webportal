
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export const PatientAssignmentManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedNutritionist, setSelectedNutritionist] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  
  // Query for all patients
  const { data: patients, isLoading: patientsLoading, error: patientsError } = useQuery({
    queryKey: ["all_patients"],
    queryFn: async () => {
      try {
        // Get all users with patient role
        const { data, error } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'patient');
          
        if (error) throw error;
        
        if (!data || data.length === 0) return [];
        
        // Get profile info for all patients
        const patientIds = data.map(item => item.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', patientIds);
          
        if (profilesError) throw profilesError;
        
        return profiles as Profile[];
      } catch (error) {
        console.error("Error fetching patients:", error);
        toast({
          title: "Error fetching patients",
          description: error.message || "Failed to load patient data",
          variant: "destructive"
        });
        return [];
      }
    }
  });
  
  // Query for all doctors
  const { data: doctors, isLoading: doctorsLoading, error: doctorsError } = useQuery({
    queryKey: ["all_doctors"],
    queryFn: async () => {
      try {
        // Get all users with doctor role
        const { data, error } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'doctor');
          
        if (error) throw error;
        
        if (!data || data.length === 0) return [];
        
        // Get profile info for all doctors
        const doctorIds = data.map(item => item.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', doctorIds);
          
        if (profilesError) throw profilesError;
        
        return profiles as Profile[];
      } catch (error) {
        console.error("Error fetching doctors:", error);
        toast({
          title: "Error fetching doctors",
          description: error.message || "Failed to load doctor data",
          variant: "destructive"
        });
        return [];
      }
    }
  });
  
  // Query for all nutritionists
  const { data: nutritionists, isLoading: nutritionistsLoading, error: nutritionistsError } = useQuery({
    queryKey: ["all_nutritionists"],
    queryFn: async () => {
      try {
        // Get all users with nutritionist role
        const { data, error } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'nutritionist');
          
        if (error) throw error;
        
        if (!data || data.length === 0) return [];
        
        // Get profile info for all nutritionists
        const nutritionistIds = data.map(item => item.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', nutritionistIds);
          
        if (profilesError) throw profilesError;
        
        return profiles as Profile[];
      } catch (error) {
        console.error("Error fetching nutritionists:", error);
        toast({
          title: "Error fetching nutritionists",
          description: error.message || "Failed to load nutritionist data",
          variant: "destructive"
        });
        return [];
      }
    }
  });
  
  useEffect(() => {
    if (patientsError || doctorsError || nutritionistsError) {
      console.error("Data fetch errors:", { patientsError, doctorsError, nutritionistsError });
    }
  }, [patientsError, doctorsError, nutritionistsError]);
  
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
      setIsAssigning(true);
      
      const { data, error } = await supabase.functions.invoke('admin-assign-care-team', {
        body: {
          action: "assignDoctor",
          patientId: selectedPatient,
          doctorId: selectedDoctor
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Doctor assigned successfully",
        description: "The doctor has been assigned to the patient"
      });
      
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ["doctor_patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient_doctor"] });
      
    } catch (error: any) {
      console.error("Error assigning doctor:", error);
      toast({
        title: "Assignment failed",
        description: error.message || "An error occurred while assigning the doctor",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
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
      setIsAssigning(true);
      
      const { data, error } = await supabase.functions.invoke('admin-assign-care-team', {
        body: {
          action: "assignNutritionist",
          patientId: selectedPatient,
          nutritionistId: selectedNutritionist
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Nutritionist assigned successfully",
        description: "The nutritionist has been assigned to the patient"
      });
      
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ["nutritionist_patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient_nutritionist"] });
      
    } catch (error: any) {
      console.error("Error assigning nutritionist:", error);
      toast({
        title: "Assignment failed",
        description: error.message || "An error occurred while assigning the nutritionist",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };
  
  const formatName = (profile: Profile) => {
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
  };

  const isLoading = patientsLoading || doctorsLoading || nutritionistsLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Assign Care Providers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
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
                  {!patients?.length && (
                    <SelectItem value="no-data" disabled>No patients available</SelectItem>
                  )}
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
                      {!doctors?.length && (
                        <SelectItem value="no-data" disabled>No doctors available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleAssignDoctor} 
                  disabled={!selectedPatient || !selectedDoctor || isAssigning}
                  className="w-full"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign Doctor to Patient"
                  )}
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
                      {!nutritionists?.length && (
                        <SelectItem value="no-data" disabled>No nutritionists available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleAssignNutritionist} 
                  disabled={!selectedPatient || !selectedNutritionist || isAssigning}
                  className="w-full"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign Nutritionist to Patient"
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
