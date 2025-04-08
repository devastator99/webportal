
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SyncCareTeamsButton = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      console.log("Starting care team room sync...");
      
      // Directly use SQL function to sync all care team rooms
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .rpc('get_patient_assignments_report');
      
      if (assignmentsError) {
        throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
      }
      
      console.log(`Found ${assignmentsData.length} patient assignments to sync`);
      
      // Results to track the operation
      const results = [];
      
      // Process each assignment to create or update room
      for (const assignment of assignmentsData) {
        try {
          // Only process if both patient and provider exists
          if (assignment.patient_id && (assignment.doctor_id || assignment.nutritionist_id)) {
            const { data: roomId, error: roomError } = await supabase
              .rpc('create_care_team_room', {
                p_patient_id: assignment.patient_id,
                p_doctor_id: assignment.doctor_id,
                p_nutritionist_id: assignment.nutritionist_id
              });
              
            if (roomError) {
              console.error(`Error syncing room for patient ${assignment.patient_id}:`, roomError);
              results.push({
                patient_id: assignment.patient_id,
                status: 'error',
                error: roomError.message
              });
            } else {
              console.log(`Successfully synced room for patient ${assignment.patient_id}, room ID: ${roomId}`);
              results.push({
                patient_id: assignment.patient_id,
                status: 'success',
                room_id: roomId
              });
            }
          }
        } catch (err) {
          console.error(`Error processing assignment for patient ${assignment.patient_id}:`, err);
          results.push({
            patient_id: assignment.patient_id,
            status: 'error',
            error: err.message
          });
        }
      }
      
      // Count successes and errors
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      console.log("Sync complete: ", {
        totalRooms: assignmentsData.length,
        success: successCount,
        error: errorCount
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["doctor_care_team_rooms"] });
      queryClient.invalidateQueries({ queryKey: ["care_team_rooms"] });
      queryClient.invalidateQueries({ queryKey: ["user_care_team_rooms"] });
      
      const message = `Rooms synced: ${successCount} successful, ${errorCount} errors`;
      
      toast({
        title: "Care Teams Synced",
        description: message
      });
    } catch (error: any) {
      console.error("Error in sync operation:", error);
      toast({
        title: "Sync Failed",
        description: error.message || "Please check the console for details",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Syncing...' : 'Sync Care Teams'}
    </Button>
  );
};
