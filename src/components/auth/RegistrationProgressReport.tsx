
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Clock } from "lucide-react";
import { UserRegistrationStatus, RegistrationStatus } from "@/types/registration";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface RegistrationProgressReportProps {
  onCheckAgain?: () => void;
}

export const RegistrationProgressReport: React.FC<RegistrationProgressReportProps> = ({
  onCheckAgain
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<UserRegistrationStatus | null>(null);
  
  const fetchRegistrationStatus = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_registration_status', {
        p_user_id: user.id
      });
      
      if (error) {
        console.error("Error getting registration status:", error);
        toast({
          title: "Error",
          description: "Failed to fetch registration status",
          variant: "destructive"
        });
        return;
      }
      
      setRegistrationStatus(data as unknown as UserRegistrationStatus);
    } catch (err) {
      console.error("Error checking registration status:", err);
      toast({
        title: "Error",
        description: "Failed to fetch registration status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRegistrationStatus();
  }, [user?.id]);
  
  const handleCheckAgain = () => {
    fetchRegistrationStatus();
    if (onCheckAgain) {
      onCheckAgain();
    }
  };
  
  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardContent className="pt-6 flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5]"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (!registrationStatus) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Registration Status</CardTitle>
          <CardDescription>Could not retrieve status</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              We couldn't retrieve your registration status. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCheckAgain} className="w-full">Try Again</Button>
        </CardFooter>
      </Card>
    );
  }
  
  // If registration is fully completed, redirect to dashboard
  if (registrationStatus.registration_status === 'fully_registered') {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Registration Complete
          </CardTitle>
          <CardDescription>Your account is fully set up</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription>
              Your registration is complete. You can now access all features of the application.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.location.href = "/dashboard"} className="w-full">
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#9b87f5]" />
          Registration Status
        </CardTitle>
        <CardDescription>Your account is being set up</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-[#E5DEFF]/20 border-[#9b87f5]/30">
          <AlertDescription>
            Your account is currently being set up. This includes assigning your care team and creating your communication channels. This process should be completed shortly.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-5 w-5 ${registrationStatus.registration_status === 'payment_pending' ? 'text-gray-300' : 'text-green-500'}`} />
              <span>Payment Completed</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {registrationStatus.registration_status !== 'payment_pending' ? 'Completed' : 'Pending'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-5 w-5 ${(['care_team_assigned', 'fully_registered'] as RegistrationStatus[]).includes(registrationStatus.registration_status) ? 'text-green-500' : 'text-gray-300'}`} />
              <span>Care Team Assignment</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {(['care_team_assigned', 'fully_registered'] as RegistrationStatus[]).includes(registrationStatus.registration_status) ? 'Completed' : 'In Progress'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-5 w-5 ${registrationStatus.registration_status === 'fully_registered' ? 'text-green-500' : 'text-gray-300'}`} />
              <span>Account Setup Complete</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {registrationStatus.registration_status === 'fully_registered' ? 'Completed' : 'In Progress'}
            </span>
          </div>
          
          {/* Show task status if available */}
          {registrationStatus.tasks && registrationStatus.tasks.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Task Status:</p>
              {registrationStatus.tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <span>{task.task_type.replace(/_/g, ' ')}</span>
                  <span className={`${
                    task.status === 'completed' ? 'text-green-500' : 
                    task.status === 'failed' ? 'text-red-500' : 
                    task.status === 'in_progress' ? 'text-blue-500' : 'text-gray-400'
                  }`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleCheckAgain}
          className="w-full"
        >
          Check Status Again
        </Button>
      </CardFooter>
    </Card>
  );
};
