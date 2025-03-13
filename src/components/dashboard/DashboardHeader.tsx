
import React, { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

// Define a proper interface for the profile data
interface ProfileData {
  first_name?: string;
  last_name?: string;
}

interface DashboardHeaderProps {
  actionButton?: ReactNode;
}

export const DashboardHeader = ({ actionButton }: DashboardHeaderProps) => {
  const isMobile = useIsMobile();
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  // Fetch profile data with improved error handling
  const { data: profile, isLoading, error: queryError } = useQuery<ProfileData | null>({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          // Check if it's a "no rows returned" error, which means profile doesn't exist
          if (error.code === 'PGRST116') {
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
              toast({
                variant: "destructive",
                title: "Profile Error",
                description: "Could not create user profile"
              });
              return { first_name: "User" };
            }
            
            return newProfile;
          }
          
          // For other errors, return fallback name
          toast({
            variant: "destructive",
            title: "Profile Error",
            description: "Could not load profile data"
          });
          return { first_name: "User" };
        }

        if (!data) {
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
            toast({
              variant: "destructive",
              title: "Profile Error",
              description: "Could not create user profile"
            });
            return { first_name: "User" };
          }
          
          return newProfile;
        }

        return data;
      } catch (err) {
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
      return `Welcome, ${fallbackName}`;
    }
    
    // Use a generic name if no profile or profile name is available
    const firstName = profile?.first_name || fallbackName;
    const lastName = profile?.last_name ? ` ${profile.last_name}` : '';
    
    const prefix = userRole === 'doctor' ? 'Dr. ' : '';
    
    return `Welcome, ${prefix}${firstName}${lastName}`;
  };

  const welcomeMessage = getWelcomeMessage();
  
  // Determine if we need to use a popover (when there are multiple child elements)
  const shouldUsePopover = () => {
    if (!actionButton) return false;
    
    // Check if actionButton is a React fragment or div with multiple children
    const isFragment = React.isValidElement(actionButton) && actionButton.type === React.Fragment;
    const isDiv = React.isValidElement(actionButton) && (actionButton.type === 'div' || actionButton.type === 'div');
    
    if (isFragment || isDiv) {
      const children = React.isValidElement(actionButton) ? actionButton.props?.children : null;
      // If children is an array with more than 2 items, use popover
      return Array.isArray(children) && children.length > 2;
    }
    
    return false;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
      <h1 className={`text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white py-2 px-1 ${userRole === 'doctor' ? 'text-base sm:text-lg md:text-xl' : ''}`}>
        {welcomeMessage}
      </h1>
      
      {actionButton && (
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          {shouldUsePopover() ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white shadow-md"
                  size="sm"
                >
                  Actions <MoreHorizontal className="h-4 w-4 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-fit p-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg flex flex-col gap-2">
                {actionButton}
              </PopoverContent>
            </Popover>
          ) : (
            actionButton
          )}
        </div>
      )}
    </div>
  );
};
