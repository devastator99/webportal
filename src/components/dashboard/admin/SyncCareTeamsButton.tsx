
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
        // Pre-validate all users that will be involved in care team rooms
        console.log("Pre-validating all user profiles before creating rooms...");
        const allUserIds = new Set<string>();
        
        // Collect all user IDs that will be involved in care teams
        patientAssignmentsReport.forEach(assignment => {
          if (assignment.patient_id) allUserIds.add(assignment.patient_id);
          if (assignment.doctor_id) allUserIds.add(assignment.doctor_id);
          if (assignment.nutritionist_id) allUserIds.add(assignment.nutritionist_id);
        });
        
        // Verify all users exist in the profiles table in one batch query
        if (allUserIds.size > 0) {
          const userIdsArray = Array.from(allUserIds);
          console.log(`Validating ${userIdsArray.length} user profiles...`);
          
          const { data: existingProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id')
            .in('id', userIdsArray);
            
          if (profilesError) {
            console.error("Error validating user profiles:", profilesError);
            throw new Error(`Failed to validate user profiles: ${profilesError.message}`);
          }
          
          // Create a set of existing profile IDs for quick lookup
          const validProfileIds = new Set((existingProfiles || []).map(p => p.id));
          console.log(`Found ${validProfileIds.size} valid profiles out of ${userIdsArray.length} required users`);
          
          // Find missing profiles
          const missingProfiles = userIdsArray.filter(id => !validProfileIds.has(id));
          if (missingProfiles.length > 0) {
            console.warn(`Missing ${missingProfiles.length} user profiles: `, missingProfiles);
            
            // Try to create missing profiles with minimal data to satisfy foreign key constraints
            console.log("Attempting to create missing user profiles...");
            for (const userId of missingProfiles) {
              try {
                const { error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    id: userId,
                    first_name: 'Temporary',
                    last_name: 'User'
                  });
                  
                if (insertError) {
                  console.error(`Failed to create profile for user ${userId}:`, insertError);
                } else {
                  console.log(`Created temporary profile for user ${userId}`);
                  validProfileIds.add(userId);
                }
              } catch (e) {
                console.error(`Exception creating profile for ${userId}:`, e);
              }
            }
          }
          
          // Now create care team rooms, but only for assignments where all required profiles exist
          for (const assignment of patientAssignmentsReport) {
            try {
              // Skip if missing required data
              if (!assignment.patient_id || !assignment.doctor_id) {
                console.log(`Skipping assignment: Missing required IDs`);
                statusCounts.skipped++;
                continue;
              }
              
              // Verify all required users have valid profiles
              const requiredUsers = [
                assignment.patient_id, 
                assignment.doctor_id, 
                ...(assignment.nutritionist_id ? [assignment.nutritionist_id] : [])
              ];
              
              const allUsersValid = requiredUsers.every(id => validProfileIds.has(id));
              
              if (!allUsersValid) {
                console.log(`Skipping room creation: Not all required profiles exist for patient: ${assignment.patient_first_name} ${assignment.patient_last_name}`);
                statusCounts.skipped++;
                continue;
              }
              
              // Create/update care team room with improved error handling
              try {
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
              } catch (roomCreationError: any) {
                console.error(`Exception creating room:`, roomCreationError);
                statusCounts.error++;
                continue;
              }
            } catch (assignmentError) {
              console.error("Error processing assignment:", assignmentError);
              statusCounts.error++;
            }
          }
        } else {
          console.warn("No user IDs found to validate - this is unusual");
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
          
          // Check room members for the first room as a sample
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
