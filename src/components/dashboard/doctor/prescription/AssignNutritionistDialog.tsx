import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Nutritionist {
  id: string;
  first_name: string;
  last_name: string;
}

interface AssignNutritionistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  prescriptionId: string;
}

export const AssignNutritionistDialog = ({
  isOpen,
  onClose,
  patientId,
  prescriptionId
}: AssignNutritionistDialogProps) => {
  const [nutritionists, setNutritionists] = useState<Nutritionist[]>([]);
  const [selectedNutritionist, setSelectedNutritionist] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchNutritionists = async () => {
      try {
        setIsFetching(true);
        const { data, error } = await supabase.rpc(
          'get_nutritionists'
        );
          
        if (error) {
          throw error;
        }
        
        setNutritionists(data || []);
      } catch (error: any) {
        console.error('Error fetching nutritionists:', error);
        toast({
          title: "Error",
          description: `Failed to load nutritionists: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsFetching(false);
      }
    };

    if (isOpen) {
      fetchNutritionists();
    }
  }, [isOpen, toast]);

  const handleAssign = async () => {
    if (!selectedNutritionist) {
      toast({
        title: "Error",
        description: "Please select a nutritionist",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log("Assigning patient to nutritionist:", {
        patientId,
        nutritionistId: selectedNutritionist,
        doctorId: user.id
      });

      // Use assign_patient_to_nutritionist RPC function
      const { data, error } = await supabase.rpc(
        'assign_patient_to_nutritionist',
        {
          p_patient_id: patientId,
          p_nutritionist_id: selectedNutritionist,
          p_doctor_id: user.id
        }
      );

      if (error) {
        throw error;
      }

      const selectedNutritionistData = nutritionists.find(n => n.id === selectedNutritionist);
      
      toast({
        title: "Success",
        description: `Patient assigned to ${selectedNutritionistData?.first_name} ${selectedNutritionistData?.last_name}`,
      });

      try {
        await supabase.functions.invoke('assign-nutritionist-notification', {
          body: { 
            patientId: patientId,
            nutritionistId: selectedNutritionist,
            prescriptionId: prescriptionId
          }
        });
      } catch (notifyError) {
        console.error("Error sending notification:", notifyError);
      }

      onClose();
    } catch (error: any) {
      console.error('Error assigning nutritionist:', error);
      toast({
        title: "Error",
        description: `Failed to assign nutritionist: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Nutritionist</DialogTitle>
          <DialogDescription>
            Assign a nutritionist to create a personalized health plan for this patient.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nutritionist-select">Select Nutritionist</Label>
            {isFetching ? (
              <div className="text-sm text-muted-foreground">Loading nutritionists...</div>
            ) : nutritionists.length === 0 ? (
              <div className="text-sm text-muted-foreground">No nutritionists available.</div>
            ) : (
              <Select
                value={selectedNutritionist}
                onValueChange={setSelectedNutritionist}
                disabled={isLoading}
              >
                <SelectTrigger id="nutritionist-select">
                  <SelectValue placeholder="Select a nutritionist" />
                </SelectTrigger>
                <SelectContent>
                  {nutritionists.map((nutritionist) => (
                    <SelectItem key={nutritionist.id} value={nutritionist.id}>
                      {nutritionist.first_name} {nutritionist.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedNutritionist || isLoading}>
            {isLoading ? "Assigning..." : "Assign Nutritionist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
