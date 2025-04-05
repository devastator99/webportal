
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
          let careTeamError = null;
          
          // Try to fetch care team (including AI bot)
          try {
            // Use the edge function to get care team
            const { data: careTeamData, error } = await supabase.functions.invoke('get-patient-care-team', {
              body: { patient_id: user.id }
            });
            
            if (!error && careTeamData) {
              careTeam = careTeamData as UserProfile[];
            } else {
              careTeamError = error;
              console.error("Error fetching care team:", error);
            }
          } catch (err) {
            careTeamError = err;
            console.error("Failed to call get-patient-care-team function:", err);
          }
          
          // If the function call fails, try to get doctor and nutritionist separately
          if (careTeamError || careTeam.length === 0) {
            // Get doctor from edge function
            try {
              const { data: doctorData, error: doctorError } = await supabase.functions.invoke('get-doctor-for-patient', {
                body: { patient_id: user.id }
              });
              
              if (!doctorError && doctorData && doctorData.id) {
                careTeam.push({
                  ...doctorData,
                  role: "doctor"
                });
              }
            } catch (err) {
              console.error("Error fetching doctor:", err);
            }
            
            // Get nutritionist from edge function
            try {
              const { data: nutritionistData, error: nutritionistError } = await supabase.functions.invoke('get-nutritionist-for-patient', {
                body: { patient_id: user.id }
              });
              
              if (!nutritionistError && nutritionistData && nutritionistData.id) {
                careTeam.push({
                  ...nutritionistData,
                  role: "nutritionist"
                });
              }
            } catch (err) {
              console.error("Error fetching nutritionist:", err);
            }
            
            // Add AI bot manually if using fallback
            careTeam.push({
              id: '00000000-0000-0000-0000-000000000000',
              first_name: 'AI',
              last_name: 'Assistant',
              role: 'aibot'
            });
          }
          
          // Get administrators
          // We query this differently to avoid recursion issues, not using joins
          const { data: userRoles, error: userRolesError } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "administrator");
            
          if (userRolesError) {
            console.error("Error fetching admin roles:", userRolesError);
            toast({
              title: "Error",
              description: "Could not load administrators for chat",
              variant: "destructive"
            });
          }
          
          const adminIds = (userRoles || []).map(ur => ur.user_id).filter(id => id !== user.id);
          let formattedAdmins: UserProfile[] = [];
          
          if (adminIds.length > 0) {
            const { data: adminProfiles, error: adminProfilesError } = await supabase
              .from("profiles")
              .select("id, first_name, last_name")
              .in("id", adminIds);
              
            if (adminProfilesError) {
              console.error("Error fetching admin profiles:", adminProfilesError);
            } else {
              formattedAdmins = (adminProfiles || []).map(admin => ({
                id: admin.id,
                first_name: admin.first_name,
                last_name: admin.last_name,
                role: "administrator"
              }));
            }
          }
          
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
        } else if (userRole === "doctor" || userRole === "nutritionist") {
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
        } else if (userRole === "administrator") {
          // Query user roles separately to avoid recursion
          const { data: userRoles, error: userRolesError } = await supabase
            .from("user_roles")
            .select("user_id, role");
          
          if (userRolesError) {
            console.error("Error fetching user roles:", userRolesError);
            throw userRolesError;
          }
          
          // Create a map of user_id to role
          const roleMap = new Map();
          (userRoles || []).forEach(ur => {
            roleMap.set(ur.user_id, ur.role);
          });
          
          // Get all profiles except the current user
          const { data: allProfiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .neq("id", user.id);
          
          if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            throw profilesError;
          }
          
          // Format users with their roles from the map
          const formattedUsers = (allProfiles || []).map(profile => ({
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: roleMap.get(profile.id) || "user"
          }));
          
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
