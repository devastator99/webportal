
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ReactNode } from "react";

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
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
        if (userRole === "patient") {
          let careTeam: UserProfile[] = [];
          
          // Use RPC function to get care team (this is SECURITY DEFINER function)
          // Using type assertion to handle the TypeScript error
          const { data: careTeamData, error: careTeamError } = await supabase
            .rpc('get_patient_care_team_members', { p_patient_id: user.id }) as unknown as {
              data: UserProfile[] | null,
              error: Error | null
            };
          
          if (careTeamError) {
            console.error("Error fetching care team with RPC:", careTeamError);
            toast({
              title: "Error",
              description: "Could not load your care team. Please try again later.",
              variant: "destructive"
            });
          } else {
            careTeam = (careTeamData as UserProfile[]) || [];
          }
          
          // Get administrators - Use security definer function 
          const { data: admins, error: adminsError } = await supabase
            .rpc('get_administrators');
            
          if (adminsError) {
            console.error("Error fetching admins:", adminsError);
            toast({
              title: "Error",
              description: "Could not load administrators for chat",
              variant: "destructive"
            });
          }
          
          // Format admin users
          const formattedAdmins = Array.isArray(admins) ? admins.map(admin => ({
            id: admin.id,
            first_name: admin.first_name,
            last_name: admin.last_name,
            role: "administrator"
          })) : [];
          
          // Create care team group from assigned doctor, nutritionist and AI bot
          const careTeamMembers = careTeam.filter(member => 
            member.role === "doctor" || member.role === "nutritionist" || member.role === "aibot"
          );
          
          const careTeamGroup = careTeamMembers.length > 0 ? {
            groupName: "Care Team",
            members: [...careTeamMembers]
          } : null;
          
          // Combine providers, AI bot and admins, ensuring admins are always included
          const allUsers = [...careTeam, ...formattedAdmins];
          
          return { 
            assignedUsers: allUsers,
            careTeamGroup: careTeamGroup
          };
        } 
        else if (userRole === "doctor" || userRole === "nutritionist") {
          // Get assigned patients using edge function
          const { data: patientsData, error: patientsError } = await supabase.functions.invoke('get-assigned-patients', {
            body: { 
              provider_id: user.id,
              provider_role: userRole
            }
          });
          
          if (patientsError) {
            console.error("Error fetching assigned patients:", patientsError);
            throw patientsError;
          }
          
          const formattedPatients = (patientsData || []).map((p: any) => ({
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            role: "patient"
          }));
          
          return { 
            assignedUsers: formattedPatients,
            careTeamGroup: null
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
                  role: u.role || "user"
                }))
            : [];
          
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
    enabled: !!user?.id && !!userRole
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
