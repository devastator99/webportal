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
  
  const ensureUserProfiles = async (userIds: string[]) => {
    try {
      if (!userIds.length) return { success: true, validIds: [] };
      
      console.log("Ensuring profiles exist for users:", userIds);

      const { data: existingProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);
        
      if (profilesError) {
        console.error("Error checking existing profiles:", profilesError);
        return { success: false, error: profilesError.message };
      }
      
      const existingProfileMap = (existingProfiles || []).reduce((map, profile) => {
        map[profile.id] = profile;
        return map;
      }, {} as Record<string, any>);
      
      const missingIds = userIds.filter(id => !existingProfileMap[id]);
      console.log("Existing profiles:", Object.keys(existingProfileMap).length);
      console.log("Missing profiles:", missingIds.length, missingIds);
      
      if (missingIds.length === 0) {
        return { success: true, validIds: userIds };
      }
      
      const aiBot = {
        id: '00000000-0000-0000-0000-000000000000',
        first_name: 'AI',
        last_name: 'Assistant'
      };
      
      const aiAssistantId = '00000000-0000-0000-0000-000000000000';
      const hasAiBot = missingIds.includes(aiAssistantId);
      const realUserIds = missingIds.filter(id => id !== aiAssistantId);
      
      if (realUserIds.length === 0 && hasAiBot) {
        const { error: aiBotError } = await supabase
          .from('profiles')
          .upsert([aiBot], { onConflict: 'id' });
          
        if (aiBotError) {
          console.error("Error creating AI bot profile:", aiBotError);
          return { success: false, error: `Failed to create AI bot profile: ${aiBotError.message}` };
        }
        
        console.log("Successfully created AI bot profile");
        return { success: true, validIds: userIds };
      }
      
      if (realUserIds.length > 0) {
        const { data: usersResult, error: usersError } = await supabase.functions.invoke('verify-users-exist', {
          body: { userIds: realUserIds }
        });
        
        if (usersError) {
          console.error("Error verifying users:", usersError);
          return { success: false, error: `User verification failed: ${usersError.message}` };
        }
        
        const validUserIds = usersResult?.validUserIds || [];
        const invalidUserIds = usersResult?.invalidUserIds || [];
        
        if (invalidUserIds.length > 0) {
          console.warn("Some user IDs are invalid:", invalidUserIds);
        }
        
        console.log("Valid users that need profiles:", validUserIds);
        
        const usersData: Record<string, { first_name: string, last_name: string }> = {};
        
        [
          { list: patients, role: 'Patient' },
          { list: doctors, role: 'Doctor' },
          { list: nutritionists, role: 'Nutritionist' }
        ].forEach(({ list, role }) => {
          if (!list) return;
          
          list.forEach(item => {
            if (validUserIds.includes(item.id)) {
              usersData[item.id] = {
                first_name: item.first_name || `Unknown`,
                last_name: item.last_name || role
              };
            }
          });
        });
        
        const profilesToCreate = validUserIds.map(userId => ({
          id: userId,
          first_name: usersData[userId]?.first_name || 'User',
          last_name: usersData[userId]?.last_name || 'Unknown'
        }));
        
        if (hasAiBot) {
          profilesToCreate.push(aiBot);
        }
        
        console.log("Creating profiles:", profilesToCreate);
        
        if (profilesToCreate.length > 0) {
          const { error: insertError } = await supabase
            .from('profiles')
            .upsert(profilesToCreate, { onConflict: 'id' });
            
          if (insertError) {
            console.error("Error creating profiles:", insertError);
            return { 
              success: false, 
              error: `Failed to create profiles: ${insertError.message}` 
            };
          }
          
          console.log("Successfully created profiles");
        }
        
        const allValidIds = [...Object.keys(existingProfileMap)];
        
        validUserIds.forEach(id => {
          if (!allValidIds.includes(id)) {
            allValidIds.push(id);
          }
        });
        
        if (hasAiBot && !allValidIds.includes(aiAssistantId)) {
          allValidIds.push(aiAssistantId);
        }
        
        return { 
          success: true, 
          validIds: allValidIds,
          invalidUserIds
        };
      }
      
      return { success: true, validIds: Object.keys(existingProfileMap) };
    } catch (error: any) {
      console.error("Error ensuring user profiles:", error);
      return { success: false, error: error.message };
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
      
      const userIds = [
        selectedPatient, 
        selectedDoctor, 
        ...(selectedNutritionist ? [selectedNutritionist] : []),
        '00000000-0000-0000-0000-000000000000'
      ];
      
      console.log("Ensuring profiles exist for users:", userIds);
      const profilesResult = await ensureUserProfiles(userIds);
      
      if (!profilesResult.success) {
        throw new Error(`Error with profiles: ${profilesResult.error}`);
      }
      
      if (profilesResult.invalidUserIds?.length > 0) {
        throw new Error(`Some users do not exist in the system: ${profilesResult.invalidUserIds.join(', ')}`);
      }
      
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
