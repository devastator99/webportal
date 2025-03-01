
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

type DashboardHeaderProps = {
  actionButton?: React.ReactNode;
};

export const DashboardHeader = ({ actionButton }: DashboardHeaderProps) => {
  const isMobile = useIsMobile();
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();

  // Fetch profile data with improved error handling
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log("Fetching profile for user:", user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        toast({
          variant: "destructive",
          title: "Error fetching profile",
          description: "Please refresh the page"
        });
        return null;
      }

      console.log("Profile data loaded:", data);
      return data;
    },
    enabled: !!user?.id
  });

  // Create welcome message based on user role and profile data
  const getWelcomeMessage = () => {
    if (isLoading) return "Welcome";
    
    if (!profile?.first_name) return "Welcome";
    
    const prefix = userRole === 'doctor' ? 'Dr. ' : '';
    return `Welcome, ${prefix}${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
      <h1 className="text-2xl sm:text-3xl font-bold truncate">
        {getWelcomeMessage()}
      </h1>
      <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
        {actionButton}
        <Button 
          variant="outline" 
          onClick={signOut}
          className="gap-2 flex-1 sm:flex-initial"
          size={isMobile ? "lg" : "default"}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
