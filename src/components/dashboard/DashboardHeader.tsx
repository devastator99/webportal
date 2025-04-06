
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardHeaderProps {
  actionButton?: React.ReactNode;
}

export const DashboardHeader = ({ actionButton }: DashboardHeaderProps) => {
  const { user, userRole } = useAuth();
  
  // Fetch the patient count for doctors
  const { data: patientCount, isLoading: isLoadingCount } = useQuery({
    queryKey: ["doctor_patient_count", user?.id],
    queryFn: async () => {
      if (!user?.id || userRole !== "doctor") return null;
      
      try {
        console.log("Fetching patient count for doctor:", user.id);
        const { data, error } = await supabase.rpc("get_doctor_patients_count", {
          doctor_id: user.id
        });
        
        if (error) {
          console.error("Error fetching doctor patient count:", error);
          throw error;
        }
        
        return data as number;
      } catch (error) {
        console.error("Error in patient count query:", error);
        return null;
      }
    },
    enabled: !!user?.id && userRole === "doctor",
    staleTime: 60000 // Cache for 1 minute
  });

  // Extract user's name from metadata
  const firstName = user?.user_metadata?.first_name || "";
  const lastName = user?.user_metadata?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();
  
  // Display appropriate greeting based on role
  const getGreeting = () => {
    if (!fullName) return "Welcome to your dashboard";
    
    switch (userRole) {
      case "doctor":
        return `Hello, Dr. ${firstName}`;
      case "patient":
        return `Hello, ${firstName}`;
      case "nutritionist":
        return `Hello, ${fullName}`;
      case "administrator":
        return `Hello, Admin ${firstName}`;
      default:
        return `Hello, ${fullName}`;
    }
  };

  return (
    <Card className="bg-background">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{getGreeting()}</h1>
            {userRole === "doctor" && (
              <p className="text-muted-foreground">
                {isLoadingCount ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  `You have ${patientCount || 0} assigned patient${patientCount !== 1 ? 's' : ''}`
                )}
              </p>
            )}
          </div>
          
          {actionButton && (
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {actionButton}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
