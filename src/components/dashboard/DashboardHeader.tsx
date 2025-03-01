
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

  // Fetch profile data with improved error handling and detailed logging
  const { data: profile, isLoading, error: queryError } = useQuery<ProfileData | null>({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log("No user ID available for profile fetch");
        return null;
      }
      
      console.log(`[Profile Debug] Starting profile fetch for user:`, {
        id: user.id,
        email: user.email,
        queryKey: ["profile", user.id]
      });
      
      try {
        console.log(`[Profile Debug] Making Supabase query for user ID: ${user.id}`);
        
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("[Profile Debug] Error fetching profile:", error);
          
          // Check if it's a "no rows returned" error, which means profile doesn't exist
          if (error.code === 'PGRST116') {
            console.log("[Profile Debug] Profile doesn't exist, creating a new one");
            
            // Create a profile for this user
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert([{ 
                id: user.id, 
                first_name: "User" 
              }])
              .select()
              .single();
              
            if (createError) {
              console.error("[Profile Debug] Error creating profile:", createError);
              toast({
                variant: "destructive",
                title: "Profile Error",
                description: "Could not create user profile"
              });
              return { first_name: "User" };
            }
            
            console.log("[Profile Debug] Created new profile:", newProfile);
            return newProfile;
          }
          
          // For other errors, return fallback name
          console.log("[Profile Debug] Using fallback name due to error");
          toast({
            variant: "destructive",
            title: "Profile Error",
            description: "Could not load profile data"
          });
          return { first_name: "User" };
        }

        if (!data) {
          console.log("[Profile Debug] No profile data returned, creating a new profile");
          
          // Create a profile for this user
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert([{ 
              id: user.id, 
              first_name: "User" 
            }])
            .select()
            .single();
            
          if (createError) {
            console.error("[Profile Debug] Error creating profile:", createError);
            toast({
              variant: "destructive",
              title: "Profile Error",
              description: "Could not create user profile"
            });
            return { first_name: "User" };
          }
          
          console.log("[Profile Debug] Created new profile:", newProfile);
          return newProfile;
        }

        console.log("[Profile Debug] Successfully fetched profile data:", data);
        return data;
      } catch (err) {
        console.error("[Profile Debug] Exception in profile fetch:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred"
        });
        return { first_name: "User" };
      }
    },
    enabled: !!user?.id,
    retry: 1,
    staleTime: 60000, // Cache for 1 minute
  });

  console.log("[Profile Debug] Query result:", { 
    profile, 
    isLoading, 
    hasError: !!queryError,
    userInfo: user ? { id: user.id, email: user.email } : 'No user'
  });

  // Create welcome message based on user role and profile data
  const getWelcomeMessage = () => {
    if (!user) {
      return "Welcome to your dashboard";
    }
    
    const fallbackName = "User";
    
    // While loading, show a simple welcome
    if (isLoading) {
      return `Welcome back!`;
    }
    
    if (queryError) {
      console.error("[Profile Debug] Error in profile query:", queryError);
      return `Welcome, ${fallbackName}`;
    }
    
    // Use a generic name if no profile or profile name is available
    const firstName = profile?.first_name || fallbackName;
    const lastName = profile?.last_name ? ` ${profile.last_name}` : '';
    
    const prefix = userRole === 'doctor' ? 'Dr. ' : '';
    
    console.log("[Profile Debug] Building welcome message with:", { 
      firstName, lastName, prefix, userRole 
    });
    
    return `Welcome, ${prefix}${firstName}${lastName}`;
  };

  const welcomeMessage = getWelcomeMessage();
  console.log("[Profile Debug] Final welcome message:", welcomeMessage);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black dark:text-white py-2 px-1">
        {welcomeMessage}
      </h1>
      {actionButton && (
        <div className="flex gap-2 sm:gap-4 justify-end w-full sm:w-auto">
          {actionButton}
        </div>
      )}
    </div>
  );
};
