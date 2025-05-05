
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Loader2, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const DefaultCareTeamSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedNutritionist, setSelectedNutritionist] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Fetch doctors
  const { data: doctors, isLoading: doctorsLoading } = useQuery({
    queryKey: ["admin_doctors"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_doctors');
      if (error) throw error;
      return data || [];
    }
  });
  
  // Fetch nutritionists
  const { data: nutritionists, isLoading: nutritionistsLoading } = useQuery({
    queryKey: ["admin_nutritionists"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_nutritionists');
      if (error) throw error;
      return data || [];
    }
  });
  
  // Fetch current default care team
  const { data: defaultCareTeam, isLoading: defaultCareTeamLoading } = useQuery({
    queryKey: ["default_care_team"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_default_care_team');
      if (error) throw error;
      return data || null;
    },
    onSuccess: (data) => {
      if (data && data.default_doctor_id) {
        setSelectedDoctor(data.default_doctor_id);
        if (data.default_nutritionist_id) {
          setSelectedNutritionist(data.default_nutritionist_id);
        }
      }
    }
  });
  
  const handleNutritionistChange = (value: string) => {
    setSelectedNutritionist(value === "none" ? null : value);
  };
  
  const handleSubmit = async () => {
    if (!selectedDoctor) {
      toast({
        title: "Missing selection",
        description: "Please select a doctor",
        variant: "destructive"
      });
      return;
    }
    
    if (!user?.id) {
      toast({
        title: "Authentication error",
        description: "Please log in as an administrator",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    setSuccessMessage(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-setup-default-care-team', {
        body: {
          doctor_id: selectedDoctor,
          nutritionist_id: selectedNutritionist,
          admin_id: user.id
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Default care team updated",
        description: "New patients will be assigned to this care team"
      });
      
      setSuccessMessage("Default care team has been updated successfully");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["default_care_team"] });
      queryClient.invalidateQueries({ queryKey: ["registration_progress"] });
      
    } catch (error: any) {
      console.error("Error setting up default care team:", error);
      
      toast({
        title: "Error updating default care team",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatName = (profile: any) => {
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
  };
  
  const isLoading = doctorsLoading || nutritionistsLoading || defaultCareTeamLoading;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Default Care Team Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {successMessage && (
          <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        <p className="text-sm text-muted-foreground mb-4">
          Set up the default care team that will be automatically assigned to new patients during registration.
        </p>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Default Doctor *</label>
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
              <label className="block text-sm font-medium mb-1">Select Default Nutritionist (Optional)</label>
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
              onClick={handleSubmit} 
              disabled={!selectedDoctor || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Set Default Care Team"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DefaultCareTeamSettings;
