
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Query for all patients using the RPC function
  const { data: patients, isLoading: patientsLoading, error: patientsError } = useQuery({
    queryKey: ["admin_patients"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_admin_patients');
          
        if (error) throw error;
        
        return data as Profile[] || [];
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
  
  // Query for all doctors using the RPC function
  const { data: doctors, isLoading: doctorsLoading, error: doctorsError } = useQuery({
    queryKey: ["admin_doctors"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_admin_doctors');
          
        if (error) throw error;
        
        return data as Profile[] || [];
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
  
  // Query for all nutritionists using the RPC function
  const { data: nutritionists, isLoading: nutritionistsLoading, error: nutritionistsError } = useQuery({
    queryKey: ["admin_nutritionists"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_admin_nutritionists');
          
        if (error) throw error;
        
        return data as Profile[] || [];
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

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
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
      
      // Direct database operation instead of using the Edge Function
      const { data, error } = await supabase
        .from('patient_doctor_assignments')
        .upsert({
          patient_id: selectedPatient,
          doctor_id: selectedDoctor
        })
        .select();
      
      if (error) throw error;
      
      // Set success message and show toast
      const patientName = patients?.find(p => p.id === selectedPatient);
      const doctorName = doctors?.find(d => d.id === selectedDoctor);
      
      const successMsg = `Dr. ${formatName(doctorName)} has been assigned to ${formatName(patientName)}`;
      setSuccessMessage(successMsg);
      
      toast({
        title: "Doctor assigned successfully",
        description: successMsg
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
      
      // Direct database operation instead of using the Edge Function
      const { data, error } = await supabase
        .from('patient_nutritionist_assignments')
        .upsert({
          patient_id: selectedPatient,
          nutritionist_id: selectedNutritionist
        })
        .select();
      
      if (error) throw error;
      
      // Set success message and show toast
      const patientName = patients?.find(p => p.id === selectedPatient);
      const nutritionistName = nutritionists?.find(n => n.id === selectedNutritionist);
      
      const successMsg = `Nutritionist ${formatName(nutritionistName)} has been assigned to ${formatName(patientName)}`;
      setSuccessMessage(successMsg);
      
      toast({
        title: "Nutritionist assigned successfully",
        description: successMsg
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
  
  const formatName = (profile: Profile | undefined) => {
    if (!profile) return 'Unknown';
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
        {successMessage && (
          <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
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
