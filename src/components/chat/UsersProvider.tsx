
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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
            const { data, error } = await supabase.rpc('get_patient_care_team', {
              p_patient_id: user.id
            });
            
            if (!error && data) {
              careTeam = data as UserProfile[];
            } else {
              careTeamError = error;
              console.error("Error fetching care team:", error);
            }
          } catch (err) {
            careTeamError = err;
            console.error("Failed to call get_patient_care_team function:", err);
          }
          
          // If the function call fails, try to get doctor and nutritionist separately using RPC
          if (careTeamError || careTeam.length === 0) {
            try {
              const { data: doctorData } = await supabase.rpc('get_doctor_for_patient', { 
                p_patient_id: user.id 
              });
              
              const { data: nutritionistData } = await supabase.rpc('get_nutritionist_for_patient', { 
                p_patient_id: user.id 
              });
              
              if (doctorData && Array.isArray(doctorData) && doctorData.length > 0) {
                const doctor = doctorData[0] as UserProfile;
                careTeam.push({
                  id: doctor.id,
                  first_name: doctor.first_name,
                  last_name: doctor.last_name,
                  role: "doctor"
                });
              }
              
              if (nutritionistData && Array.isArray(nutritionistData) && nutritionistData.length > 0) {
                const nutritionist = nutritionistData[0] as UserProfile;
                careTeam.push({
                  id: nutritionist.id,
                  first_name: nutritionist.first_name,
                  last_name: nutritionist.last_name,
                  role: "nutritionist"
                });
              }
              
              // Add AI bot manually if using fallback
              careTeam.push({
                id: '00000000-0000-0000-0000-000000000000',
                first_name: 'AI',
                last_name: 'Assistant',
                role: 'aibot'
              });
            } catch (err) {
              console.error("Error in fallback doctor/nutritionist fetch:", err);
            }
          }
          
          // Always get administrators for patients
          const { data: admins, error: adminsError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, user_role:user_roles(role)")
            .eq("user_roles.role", "administrator");
            
          if (adminsError) {
            console.error("Error fetching admins:", adminsError);
            toast({
              title: "Error",
              description: "Could not load administrators for chat",
              variant: "destructive"
            });
          }
          
          // Format admin users
          const formattedAdmins = (admins || []).map(admin => ({
            id: admin.id,
            first_name: admin.first_name,
            last_name: admin.last_name,
            role: "administrator"
          }));
          
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
          // Get assigned patients for this doctor/nutritionist
          const { data, error } = await supabase.rpc('get_assigned_patients', {
            p_provider_id: user.id,
            p_provider_role: userRole
          });
          
          if (error) throw error;
          return { 
            assignedUsers: data as UserProfile[],
            careTeamGroup: null
          };
        } else if (userRole === "administrator") {
          // Admin can chat with everyone
          const { data, error } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, user_role:user_roles(role)")
            .neq("id", user.id);
          
          if (error) throw error;
          return { 
            assignedUsers: data as UserProfile[],
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
