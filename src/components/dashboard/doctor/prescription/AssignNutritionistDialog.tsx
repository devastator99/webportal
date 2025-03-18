
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [selectedNutritionist, setSelectedNutritionist] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  // Fetch available nutritionists
  useEffect(() => {
    const fetchNutritionists = async () => {
      try {
        setIsFetching(true);
        const { data, error } = await supabase.rpc('get_nutritionists');
        
        if (error) {
          throw error;
        }
        
        setNutritionists(data as Nutritionist[] || []);
      } catch (error: any) {
        console.error("Error fetching nutritionists:", error);
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

  const handleAssignNutritionist = async () => {
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

      // Use the RPC function to assign patient to nutritionist
      const { data: assignmentId, error: assignError } = await supabase
        .rpc('assign_patient_to_nutritionist', {
          p_patient_id: patientId,
          p_nutritionist_id: selectedNutritionist
        });

      if (assignError) {
        throw assignError;
      }

      // Now find the nutritionist's name for the notification
      const selectedNutritionistData = nutritionists.find(n => n.id === selectedNutritionist);
      
      toast({
        title: "Success",
        description: `Patient assigned to ${selectedNutritionistData?.first_name} ${selectedNutritionistData?.last_name}`,
      });

      // Call edge function to send WhatsApp notification to nutritionist about new patient assignment
      try {
        await supabase.functions.invoke('assign-nutritionist-notification', {
          body: { 
            nutritionistId: selectedNutritionist,
            patientId: patientId,
            prescriptionId: prescriptionId
          }
        });
      } catch (notifyError) {
        console.error("Error sending notification:", notifyError);
        // Don't fail the whole operation if notification fails
      }

      onClose();
    } catch (error: any) {
      console.error("Error assigning nutritionist:", error);
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign a Nutritionist</DialogTitle>
          <DialogDescription>
            The nutritionist will create a personalized health plan for this patient based on your prescription.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nutritionist">Select Nutritionist</Label>
            {isFetching ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select 
                value={selectedNutritionist} 
                onValueChange={setSelectedNutritionist}
                disabled={isLoading}
              >
                <SelectTrigger id="nutritionist">
                  <SelectValue placeholder="Select a nutritionist" />
                </SelectTrigger>
                <SelectContent>
                  {nutritionists.length === 0 ? (
                    <SelectItem value="none" disabled>No nutritionists available</SelectItem>
                  ) : (
                    nutritionists.map((nutritionist) => (
                      <SelectItem key={nutritionist.id} value={nutritionist.id}>
                        {nutritionist.first_name} {nutritionist.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAssignNutritionist} disabled={isLoading || !selectedNutritionist}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Nutritionist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
