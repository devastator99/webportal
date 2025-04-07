
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
      
      // First check if there are any patient assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('patient_assignments')
        .select('id, patient_id, doctor_id, nutritionist_id')
        .limit(100);
        
      if (assignmentsError) {
        console.error('Error checking patient assignments:', assignmentsError);
        throw new Error(`Failed to check patient assignments: ${assignmentsError.message}`);
      } else {
        console.log(`Found ${assignments?.length || 0} patient assignments before sync`);
        if (assignments && assignments.length > 0) {
          console.log("Sample assignments:", assignments.slice(0, 5));
        } else {
          console.error("No patient assignments found - this is likely why no care teams are being created!");
          throw new Error("No patient assignments found. Please create patient assignments first.");
        }
      }
      
      // Get patient assignments report for accurate data
      const { data: patientAssignmentsReport, error: reportError } = await supabase
        .rpc('get_patient_assignments_report');
        
      if (reportError) {
        console.error("Error fetching patient assignments report:", reportError);
        throw new Error(`Failed to fetch patient assignments: ${reportError.message}`);
      }
      
      console.log(`Found ${patientAssignmentsReport?.length || 0} patients in assignments report`);
      
      // Process each patient assignment to create rooms
      const createdRooms = [];
      const statusCounts = { created: 0, updated: 0, error: 0, skipped: 0 };
      
      if (patientAssignmentsReport && patientAssignmentsReport.length > 0) {
        for (const assignment of patientAssignmentsReport) {
          try {
            // Skip if missing required data
            if (!assignment.patient_id || !assignment.doctor_id) {
              console.log(`Skipping assignment: Missing required IDs`);
              statusCounts.skipped++;
              continue;
            }
            
            // Create/update care team room
            const { data: roomId, error: roomError } = await supabase.rpc(
              'create_care_team_room',
              {
                p_patient_id: assignment.patient_id,
                p_doctor_id: assignment.doctor_id,
                p_nutritionist_id: assignment.nutritionist_id
              }
            );
            
            if (roomError) {
              console.error(`Error creating room:`, roomError);
              statusCounts.error++;
              continue;
            }
            
            if (roomId) {
              createdRooms.push(roomId);
              console.log(`Room ${roomId} created/updated for patient: ${assignment.patient_first_name} ${assignment.patient_last_name}`);
              statusCounts.created++;
            } else {
              statusCounts.skipped++;
            }
          } catch (err) {
            console.error("Error processing assignment:", err);
            statusCounts.error++;
          }
        }
      }
      
      // Verify the rooms exist in the database
      if (createdRooms.length > 0) {
        const { data: rooms, error: roomsError } = await supabase
          .from('chat_rooms')
          .select('id, name, room_type, patient_id')
          .in('id', createdRooms);
          
        if (roomsError) {
          console.error('Error fetching synced rooms:', roomsError);
        } else {
          console.log(`Verified ${rooms?.length || 0} rooms exist in database`);
          
          // Check room members
          if (rooms && rooms.length > 0) {
            const roomId = rooms[0].id;
            const { data: members, error: membersError } = await supabase
              .from('room_members')
              .select('user_id, role')
              .eq('room_id', roomId);
              
            if (membersError) {
              console.error(`Error fetching members for room ${roomId}:`, membersError);
            } else {
              console.log(`Room ${roomId} has ${members?.length || 0} members:`, members);
            }
          }
        }
      }
      
      // Invalidate queries to refresh care team rooms data in the UI
      queryClient.invalidateQueries({ queryKey: ["user_care_team_rooms"] });
      
      toast({
        title: "Care teams synced successfully",
        description: `Processed ${patientAssignmentsReport?.length || 0} care team rooms (${statusCounts.created} created/updated, ${statusCounts.error} errors, ${statusCounts.skipped} skipped)`
      });
    } catch (error: any) {
      console.error("Error syncing care team rooms:", error);
      toast({
        title: "Error syncing care teams",
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
