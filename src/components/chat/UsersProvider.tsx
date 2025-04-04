
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
            try {
              // Try to get doctor from the assignments table
              const { data: doctorAssignmentData, error: doctorAssignmentError } = await supabase
                .from("patient_doctor_assignments")
                .select("doctor_id")
                .eq("patient_id", user.id)
                .single();
                
              if (!doctorAssignmentError && doctorAssignmentData?.doctor_id) {
                const { data: doctorData, error: doctorError } = await supabase
                  .from("profiles")
                  .select("id, first_name, last_name")
                  .eq("id", doctorAssignmentData.doctor_id)
                  .single();
                  
                if (!doctorError && doctorData) {
                  careTeam.push({
                    id: doctorData.id,
                    first_name: doctorData.first_name,
                    last_name: doctorData.last_name,
                    role: "doctor"
                  });
                }
              }
              
              // Try to get nutritionist from the assignments table
              const { data: nutritionistAssignmentData, error: nutritionistAssignmentError } = await supabase
                .from("patient_nutritionist_assignments")
                .select("nutritionist_id")
                .eq("patient_id", user.id)
                .single();
                
              if (!nutritionistAssignmentError && nutritionistAssignmentData?.nutritionist_id) {
                const { data: nutritionistData, error: nutritionistError } = await supabase
                  .from("profiles")
                  .select("id, first_name, last_name")
                  .eq("id", nutritionistAssignmentData.nutritionist_id)
                  .single();
                  
                if (!nutritionistError && nutritionistData) {
                  careTeam.push({
                    id: nutritionistData.id,
                    first_name: nutritionistData.first_name,
                    last_name: nutritionistData.last_name,
                    role: "nutritionist"
                  });
                }
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
            .select("id, first_name, last_name")
            .eq("user_roles.role", "administrator")
            .not("id", "eq", user.id)
            .join("user_roles", "profiles.id = user_roles.user_id");
            
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
          const { data: assignedPatients, error: assignedPatientsError } = userRole === "doctor" 
            ? await supabase
                .from("patient_doctor_assignments")
                .select("patient_id")
                .eq("doctor_id", user.id)
            : await supabase
                .from("patient_nutritionist_assignments")
                .select("patient_id")
                .eq("nutritionist_id", user.id);
                
          if (assignedPatientsError) {
            console.error("Error fetching assigned patients:", assignedPatientsError);
            throw assignedPatientsError;
          }
          
          const patientIds = (assignedPatients || []).map(p => p.patient_id);
          
          if (patientIds.length === 0) {
            return { 
              assignedUsers: [] as UserProfile[],
              careTeamGroup: null
            };
          }
          
          // Get patient profiles
          const { data: patientsData, error: patientsError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .in("id", patientIds);
            
          if (patientsError) {
            console.error("Error fetching patient profiles:", patientsError);
            throw patientsError;
          }
          
          const formattedPatients = (patientsData || []).map(p => ({
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
          // Admin can chat with everyone
          const { data: allUsers, error: allUsersError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .neq("id", user.id);
          
          if (allUsersError) {
            console.error("Error fetching all users:", allUsersError);
            throw allUsersError;
          }
          
          // Get user roles to label them correctly
          const { data: userRoles, error: userRolesError } = await supabase
            .from("user_roles")
            .select("user_id, role");
            
          if (userRolesError) {
            console.error("Error fetching user roles:", userRolesError);
          }
          
          // Create a map of user_id to role
          const roleMap = new Map();
          (userRoles || []).forEach(ur => {
            roleMap.set(ur.user_id, ur.role);
          });
          
          // Format users with their roles
          const formattedUsers = (allUsers || []).map(u => ({
            id: u.id,
            first_name: u.first_name,
            last_name: u.last_name,
            role: roleMap.get(u.id) || "user"
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
