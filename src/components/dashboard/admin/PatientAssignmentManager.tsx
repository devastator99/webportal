
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, AdminOperationResponse } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
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
  const [selectedNutritionist, setSelectedNutritionist] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { data: patients, isLoading: patientsLoading, error: patientsError } = useQuery({
    queryKey: ["admin_patients"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_admin_patients');
          
        if (error) throw error;
        
        return data as Profile[] || [];
      } catch (error: any) {
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
  
  const { data: doctors, isLoading: doctorsLoading, error: doctorsError } = useQuery({
    queryKey: ["admin_doctors"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_admin_doctors');
          
        if (error) throw error;
        
        return data as Profile[] || [];
      } catch (error: any) {
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
  
  const { data: nutritionists, isLoading: nutritionistsLoading, error: nutritionistsError } = useQuery({
    queryKey: ["admin_nutritionists"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_admin_nutritionists');
          
        if (error) throw error;
        
        return data as Profile[] || [];
      } catch (error: any) {
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

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);
  
  const verifyUserProfiles = async () => {
    try {
      // Collect user IDs to check
      const userIds = [selectedPatient, selectedDoctor];
      if (selectedNutritionist) {
        userIds.push(selectedNutritionist);
      }
      
      console.log("Verifying profiles exist for:", userIds);
      
      // Use the edge function to verify users exist and have profiles
      const { data, error } = await supabase.functions.invoke('verify-users-exist', {
        body: { userIds }
      });
      
      if (error) {
        throw new Error(`Error verifying users: ${error.message}`);
      }
      
      // Check for invalid users
      if (data.invalidUserIds && data.invalidUserIds.length > 0) {
        // Map the IDs to roles for better error messages
        const invalidRoles = data.invalidUserIds.map((id: string) => {
          if (id === selectedPatient) return "Patient";
          if (id === selectedDoctor) return "Doctor";
          if (id === selectedNutritionist) return "Nutritionist";
          return "User";
        });
        
        throw new Error(`The following users don't exist or don't have profiles: ${invalidRoles.join(', ')}. Profiles must be created during signup.`);
      }
      
      // Check for users that have auth accounts but are missing profiles
      if (data.missingProfiles && data.missingProfiles.length > 0) {
        const missingRoles = data.missingProfiles.map((id: string) => {
          if (id === selectedPatient) return "Patient";
          if (id === selectedDoctor) return "Doctor";
          if (id === selectedNutritionist) return "Nutritionist";
          return "User";
        });
        
        throw new Error(`The following users are missing profiles: ${missingRoles.join(', ')}. Profiles must be created during signup.`);
      }
      
      return true;
    } catch (error: any) {
      console.error("Error verifying profiles:", error);
      throw error;
    }
  };
  
  const handleAssignCareTeam = async () => {
    if (!selectedPatient) {
      toast({
        title: "Missing selection",
        description: "Please select a patient",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedDoctor) {
      toast({
        title: "Missing selection",
        description: "A doctor must be selected for assignment",
        variant: "destructive"
      });
      return;
    }
    
    setIsAssigning(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      console.log("Assigning care team to patient", { 
        patientId: selectedPatient, 
        doctorId: selectedDoctor, 
        nutritionistId: selectedNutritionist, 
        adminId: user?.id
      });

      if (!user?.id) {
        throw new Error("Administrator ID is missing. Please log in again.");
      }
      
      // Verify that all users have profiles before proceeding
      await verifyUserProfiles();
      
      // Now that we've verified profiles exist, assign the care team
      const { data: assignmentData, error: assignmentError } = await supabase.rpc(
        'admin_assign_care_team',
        {
          p_patient_id: selectedPatient,
          p_doctor_id: selectedDoctor,
          p_nutritionist_id: selectedNutritionist,
          p_admin_id: user.id
        }
      );
      
      console.log("RPC response for assignment:", { assignmentData, assignmentError });
      
      if (assignmentError) {
        console.error("Error in admin_assign_care_team RPC:", assignmentError);
        throw new Error(assignmentError.message || "Error assigning care team");
      }
      
      // Create care team room after successful assignment
      const { data: roomData, error: roomError } = await supabase.rpc(
        'create_care_team_room',
        {
          p_patient_id: selectedPatient,
          p_doctor_id: selectedDoctor,
          p_nutritionist_id: selectedNutritionist
        }
      );
      
      if (roomError) {
        console.error("Error creating care team room:", roomError);
        throw new Error(roomError.message || "Error creating care team room");
      } 
      
      console.log("Care team room created with ID:", roomData);
      
      const patientName = patients?.find(p => p.id === selectedPatient);
      const doctorName = doctors?.find(d => d.id === selectedDoctor);
      const nutritionistName = selectedNutritionist ? 
        nutritionists?.find(n => n.id === selectedNutritionist) : null;
      
      let successMsg = `Dr. ${formatName(doctorName)} has been assigned to ${formatName(patientName)}`;
      if (nutritionistName) {
        successMsg += ` along with nutritionist ${formatName(nutritionistName)}`;
      }
      
      successMsg += `. Care team chat room has been created with ID: ${roomData}`;
      
      setSuccessMessage(successMsg);
      
      toast({
        title: "Care team assigned successfully",
        description: `Care team and chat room assigned. Room ID: ${roomData}`,
      });
      
      setSelectedPatient("");
      setSelectedDoctor("");
      setSelectedNutritionist(null);
      
      queryClient.invalidateQueries({ queryKey: ["doctor_patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient_doctor"] });
      queryClient.invalidateQueries({ queryKey: ["nutritionist_patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient_nutritionist"] });
      queryClient.invalidateQueries({ queryKey: ["patient_assignments_report"] });
      queryClient.invalidateQueries({ queryKey: ["assigned_users"] });
      queryClient.invalidateQueries({ queryKey: ["user_care_team_rooms"] });
      
    } catch (error: any) {
      console.error("Error assigning care team:", error);
      
      setErrorMessage(error.message || "An error occurred while assigning the care team");
      
      toast({
        title: "Assignment failed",
        description: error.message || "An error occurred while assigning the care team",
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

  const handleNutritionistChange = (value: string) => {
    setSelectedNutritionist(value === "none" ? null : value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Assign Care Team
        </CardTitle>
      </CardHeader>
      <CardContent>
        {successMessage && (
          <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        {errorMessage && (
          <Alert className="mb-4 bg-red-50 border-red-200 text-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription>{errorMessage}</AlertDescription>
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
            
            <div>
              <label className="block text-sm font-medium mb-1">Select Nutritionist (Optional)</label>
              <Select 
                value={selectedNutritionist || "none"} 
                onValueChange={handleNutritionistChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a nutritionist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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
              onClick={handleAssignCareTeam} 
              disabled={!selectedPatient || !selectedDoctor || isAssigning}
              className="w-full"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Care Team and Chat Room"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
