
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

type DashboardHeaderProps = {
  actionButton?: React.ReactNode;
};

// Define a proper interface for the profile data
interface ProfileData {
  first_name?: string;
  last_name?: string;
}

export const DashboardHeader = ({ actionButton }: DashboardHeaderProps) => {
  const isMobile = useIsMobile();
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  // Fetch profile data with improved error handling
  const { data: profile, isLoading } = useQuery<ProfileData | null>({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log("No user ID available for profile fetch");
        return null;
      }
      
      console.log(`Fetching profile for user ID: ${user.id}, email: ${user.email}`);
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          toast({
            variant: "destructive",
            title: "Error fetching user profile",
            description: "Please try refreshing the page"
          });
          return null;
        }

        if (!data) {
          console.log("No profile data found for user:", user.id);
          // Try to create a profile if none exists
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert([{ id: user.id, first_name: user.email?.split('@')[0] || "User" }])
            .select()
            .single();
            
          if (createError) {
            console.error("Error creating profile:", createError);
            return { first_name: user.email?.split('@')[0] || "User" };
          }
          
          console.log("Created new profile:", newProfile);
          return newProfile;
        }

        console.log("Successfully fetched profile data:", data);
        return data;
      } catch (err) {
        console.error("Exception in profile fetch:", err);
        return { first_name: user.email?.split('@')[0] || "User" };
      }
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 60000, // Cache for 1 minute
  });

  // Create welcome message based on user role and profile data
  const getWelcomeMessage = () => {
    if (isLoading) {
      return "Welcome";
    }
    
    if (!profile || !profile.first_name) {
      return user?.email ? `Welcome, ${user.email.split('@')[0]}` : "Welcome";
    }
    
    const prefix = userRole === 'doctor' ? 'Dr. ' : '';
    const name = profile.first_name || '';
    const lastName = profile.last_name ? ` ${profile.last_name}` : '';
    
    return `Welcome, ${prefix}${name}${lastName}`;
  };

  const welcomeMessage = getWelcomeMessage();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
      <h1 className="text-2xl sm:text-3xl font-bold truncate">
        {welcomeMessage}
      </h1>
      <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
        {actionButton}
      </div>
    </div>
  );
};
