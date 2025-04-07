import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ReactNode } from "react";

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string; // Changed from optional to required
  user_role?: { role: string } | null;
}

export interface CareTeamGroup {
  groupName: string;
  members: UserProfile[];
}

interface UsersProviderProps {
  children: (data: {
    assignedUsers: UserProfile[];
    careTeamGroup: CareTeamGroup | null;
    isLoading: boolean;
    error: unknown;
  }) => ReactNode;
}

export const UsersProvider = ({ children }: UsersProviderProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get assigned users and care team group based on role
  const { data, isLoading, error } = useQuery({
    queryKey: ["assigned_users", user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return { assignedUsers: [], careTeamGroup: null };
      
      try {
        console.log("Getting users for role:", userRole, "userId:", user.id);
        
        // AI bot definition - will be added to appropriate groups based on role
        const aiBot: UserProfile = {
          id: '00000000-0000-0000-0000-000000000000',
          first_name: 'AI',
          last_name: 'Assistant',
          role: 'aibot'
        };
        
        if (userRole === "patient") {
          let careTeam: UserProfile[] = [];
          
          // Use RPC function to get care team (this is SECURITY DEFINER function)
          const { data: careTeamData, error: careTeamError } = await supabase
            .rpc('get_patient_care_team_members', { p_patient_id: user.id });
          
          if (careTeamError) {
            console.error("Error fetching care team with RPC:", careTeamError);
            throw careTeamError;
          } else {
            // Ensure all returned team members have a role property
            careTeam = Array.isArray(careTeamData) ? careTeamData.map(member => ({
              id: member.id,
              first_name: member.first_name,
              last_name: member.last_name,
              role: member.role || "unknown" // Ensure role is always defined
            })) : [];
            console.log("Retrieved care team members:", careTeam.length, careTeam);
          }
          
          // Get administrators - Use security definer function 
          const { data: admins, error: adminsError } = await supabase
            .rpc('get_administrators');
            
          if (adminsError) {
            console.error("Error fetching admins:", adminsError);
            throw adminsError;
          }
          
          // Format admin users
          const formattedAdmins = Array.isArray(admins) ? admins.map(admin => ({
            id: admin.id,
            first_name: admin.first_name,
            last_name: admin.last_name,
            role: "administrator"
          })) : [];
          
          // Ensure AI bot is in the careTeam list if not already present
          if (!careTeam.some(member => member.role === 'aibot')) {
            careTeam.push(aiBot);
          }
          
          // Make sure to add the patient themselves to the care team group
          const patientSelf: UserProfile = {
            id: user.id,
            first_name: user.user_metadata?.first_name,
            last_name: user.user_metadata?.last_name,
            role: "patient"
          };
          
          // Create care team group from assigned doctor, nutritionist and AI bot
          // Include the patient themselves in the members list so they see all messages
          const careTeamMembers = [
            ...careTeam.filter(member => 
              member.role === "doctor" || member.role === "nutritionist" || member.role === "aibot"
            ),
            patientSelf
          ];
          
          const careTeamGroup = careTeamMembers.length > 0 ? {
            groupName: "Care Team",
            members: careTeamMembers
          } : null;
          
          // Combine providers, AI bot and admins, ensuring admins are always included
          const allUsers = [...careTeam, ...formattedAdmins];
          
          console.log("Patient's care team group:", careTeamGroup);
          
          return { 
            assignedUsers: allUsers,
            careTeamGroup: careTeamGroup
          };
        } 
        else if (userRole === "doctor") {
          console.log("Doctor: Getting assigned patients");
          // Get assigned patients using the secure RPC function
          const { data: patientsData, error: patientsError } = await supabase
            .rpc('get_doctor_patients', { p_doctor_id: user.id });
          
          if (patientsError) {
            console.error("Error fetching assigned patients:", patientsError);
            throw patientsError;
          }
          
          const formattedPatients = (patientsData || []).map((p: any) => ({
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            role: "patient" // Ensure role is always defined
          }));
          
          console.log("Doctor's patients retrieved:", formattedPatients.length);
          
          // Sort patients alphabetically by name for doctors
          formattedPatients.sort((a: UserProfile, b: UserProfile) => {
            const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
            const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
            return nameA.localeCompare(nameB);
          });
          
          // Always add AI bot to doctor's patient care teams
          if (!formattedPatients.some(p => p.role === 'aibot')) {
            formattedPatients.push(aiBot);
          }
          
          // Create a special care team group for doctor to see patient messages
          const careTeamGroup = formattedPatients.length > 0 ? {
            groupName: "My Patients",
            members: formattedPatients
          } : null;
          
          return { 
            assignedUsers: formattedPatients,
            careTeamGroup: careTeamGroup
          };
        } 
        else if (userRole === "nutritionist") {
          console.log("Nutritionist: Getting assigned patients");
          // Get patients assigned to this nutritionist using the RPC function
          const { data: patientsData, error: patientsError } = await supabase
            .rpc('get_nutritionist_patients', { p_nutritionist_id: user.id });
          
          if (patientsError) {
            console.error("Error fetching nutritionist patients:", patientsError);
            throw patientsError;
          }
          
          const formattedPatients = (patientsData || []).map((p: any) => ({
            id: p.patient_id,
            first_name: p.patient_first_name,
            last_name: p.patient_last_name,
            role: "patient" // Ensure role is always defined
          }));
          
          console.log("Nutritionist's patients retrieved:", formattedPatients.length);
          
          // Sort patients alphabetically by name
          formattedPatients.sort((a: UserProfile, b: UserProfile) => {
            const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
            const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
            return nameA.localeCompare(nameB);
          });
          
          // Add AI bot to nutritionist's patient list if not already present
          if (!formattedPatients.some(p => p.role === 'aibot')) {
            formattedPatients.push(aiBot);
          }
          
          // Create a care team group for nutritionist to see patient messages
          const careTeamGroup = formattedPatients.length > 0 ? {
            groupName: "My Patients",
            members: formattedPatients
          } : null;
          
          return { 
            assignedUsers: formattedPatients,
            careTeamGroup: careTeamGroup
          };
        } 
        else if (userRole === "administrator") {
          // Use the RPC function with security definer to get all users with their roles
          const { data, error } = await supabase.rpc('get_users_with_roles');
          
          if (error) {
            console.error("Error fetching all users:", error);
            throw error;
          }
          
          // Filter out the current user and ensure data is an array
          const formattedUsers = Array.isArray(data) 
            ? data
                .filter(u => u.id !== user.id)
                .map(u => ({
                  id: u.id,
                  first_name: u.first_name,
                  last_name: u.last_name,
                  role: u.role || "user" // Ensure role is always defined
                }))
            : [];
          
          // Always add AI bot to admin's contact list
          if (!formattedUsers.some(u => u.role === 'aibot')) {
            formattedUsers.push(aiBot);
          }
          
          return { 
            assignedUsers: formattedUsers,
            careTeamGroup: null
          };
        }
        return { assignedUsers: [] as UserProfile[], careTeamGroup: null };
      } catch (error) {
        console.error("Error fetching assigned users:", error);
        toast({
          title: "Error",
          description: "Could not load chat contacts. Please try again later.",
          variant: "destructive"
        });
        return { assignedUsers: [] as UserProfile[], careTeamGroup: null };
      }
    },
    enabled: !!user?.id && !!userRole,
    staleTime: 30000 // Cache for 30 seconds
  });

  const assignedUsers = data?.assignedUsers || [];
  const careTeamGroup = data?.careTeamGroup;

  return (
    <>
      {children({
        assignedUsers,
        careTeamGroup,
        isLoading,
        error
      })}
    </>
  );
};
