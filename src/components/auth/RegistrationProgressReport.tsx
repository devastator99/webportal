
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Clock, LogIn, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { UserRegistrationStatus, RegistrationStatus, RegistrationStatusValues } from "@/types/registration";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface RegistrationProgressReportProps {
  onCheckAgain?: () => void;
}

export const RegistrationProgressReport: React.FC<RegistrationProgressReportProps> = ({
  onCheckAgain
}) => {
  const { user, signOut, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isFetching, setIsFetching] = useState(false);
  const [isProcessingTasks, setIsProcessingTasks] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<UserRegistrationStatus | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [lastProcessingError, setLastProcessingError] = useState<string | null>(null);
  
  // Helper function to check if all required tasks are actually completed
  const areAllTasksCompleted = (status: UserRegistrationStatus | null) => {
    if (!status || !status.tasks) return false;
    
    // Check if we have the minimum required tasks completed
    const requiredTaskTypes = ['assign_care_team', 'create_chat_room', 'send_welcome_notification'];
    const completedTasks = status.tasks.filter(task => task.status === 'completed');
    const completedTaskTypes = completedTasks.map(task => task.task_type);
    
    // Check if all required task types are completed
    const allRequiredCompleted = requiredTaskTypes.every(taskType => 
      completedTaskTypes.includes(taskType)
    );
    
    console.log("Task completion check:", {
      requiredTaskTypes,
      completedTaskTypes,
      allRequiredCompleted,
      registrationStatus: status.registration_status
    });
    
    return allRequiredCompleted && status.registration_status === RegistrationStatusValues.FULLY_REGISTERED;
  };
  
  const fetchRegistrationStatus = async () => {
    // Don't fetch if auth is still loading or no user
    if (authIsLoading || !user?.id) {
      console.log("Skipping fetch - auth loading:", authIsLoading, "user ID:", user?.id);
      return;
    }
    
    setIsFetching(true);
    try {
      console.log("Fetching registration status for user:", user.id);
      // Use the new secure function that bypasses RLS issues
      const { data, error } = await supabase.rpc('get_user_registration_status_safe', {
        p_user_id: user.id
      });
      
      console.log("Registration status response:", { data, error });
      
      if (error) {
        console.error("Error getting registration status:", error);
        toast({
          title: "Error",
          description: "Failed to fetch registration status",
          variant: "destructive"
        });
        return;
      }
      
      // The secure function returns JSONB directly, so we need to handle it properly
      if (data) {
        console.log("Setting registration status:", data);
        setRegistrationStatus(data as unknown as UserRegistrationStatus);
        
        // Check if ALL tasks are actually completed (not just status)
        const allCompleted = areAllTasksCompleted(data as unknown as UserRegistrationStatus);
        if (allCompleted) {
          console.log("All registration tasks are truly complete, redirecting to dashboard");
          localStorage.removeItem('registration_payment_pending');
          localStorage.removeItem('registration_payment_complete');
          
          toast({
            title: "Registration Complete",
            description: "Your account setup is complete. Redirecting to dashboard...",
          });
          
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 2000);
        } else {
          console.log("Registration status is marked complete but tasks are still pending");
        }
      } else {
        console.log("No data returned, setting default status");
        setRegistrationStatus({
          registration_status: 'payment_pending',
          tasks: []
        } as UserRegistrationStatus);
      }
    } catch (err) {
      console.error("Exception checking registration status:", err);
      toast({
        title: "Error",
        description: "Failed to fetch registration status",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleProcessRegistrationTasks = async () => {
    if (!user?.id) {
      const errorMsg = "User not authenticated";
      console.error("Process tasks error:", errorMsg);
      setLastProcessingError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    setIsProcessingTasks(true);
    setLastProcessingError(null);
    
    try {
      console.log("=== STARTING TASK PROCESSING ===");
      console.log("Triggering registration task processing for user:", user.id);
      console.log("Timestamp:", new Date().toISOString());
      
      toast({
        title: "Processing Started",
        description: "Processing your registration tasks. This may take a moment...",
      });
      
      // First check Twilio configuration
      console.log("Checking Twilio configuration...");
      const { data: configData, error: configError } = await supabase.functions.invoke('configure-twilio-notifications');
      
      if (configError) {
        console.error("Twilio configuration check failed:", configError);
        toast({
          title: "Configuration Issue",
          description: "Notification configuration needs attention. Processing will continue with email only.",
          variant: "destructive"
        });
      } else if (configData && !configData.configured) {
        console.warn("Twilio not fully configured:", configData.message);
        toast({
          title: "Partial Configuration",
          description: "SMS/WhatsApp notifications may not work. Email notifications will work.",
        });
      } else {
        console.log("Twilio configuration OK:", configData.message);
      }
      
      // Add timeout to the function call
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function call timeout after 30 seconds')), 30000);
      });
      
      const functionPromise = supabase.functions.invoke('trigger-registration-notifications', {
        body: { patient_id: user.id }
      });
      
      console.log("Function call initiated, waiting for response...");
      
      // Race between the function call and timeout
      const result = await Promise.race([functionPromise, timeoutPromise]) as any;
      const { data, error } = result;
      
      console.log("=== FUNCTION RESPONSE RECEIVED ===");
      console.log("Function response data:", data);
      console.log("Function response error:", error);
      
      if (error) {
        console.error("Edge function error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Handle specific known errors with user-friendly messages
        let errorMessage = error.message || "Failed to process registration tasks";
        
        if (error.message?.includes('column profiles.email does not exist')) {
          errorMessage = "System configuration issue detected. Please contact support.";
        } else if (error.message?.includes('care team')) {
          errorMessage = "Care team assignment is in progress. Please try again in a few minutes.";
        } else if (error.message?.includes('timeout')) {
          errorMessage = "Processing is taking longer than usual. Please try again.";
        }
        
        setLastProcessingError(errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log("Registration tasks processing result:", data);
      
      const successMessage = data?.message || "Registration tasks are being processed. Please check back in a few moments.";
      
      toast({
        title: "Processing Complete",
        description: successMessage,
      });
      
      console.log("=== REFRESHING STATUS ===");
      // Wait a moment then refresh status
      setTimeout(() => {
        console.log("Fetching updated registration status...");
        fetchRegistrationStatus();
      }, 3000);
      
    } catch (err: any) {
      console.error("=== TASK PROCESSING ERROR ===");
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      
      const errorMessage = err.message || "Failed to process registration tasks";
      setLastProcessingError(errorMessage);
      
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessingTasks(false);
      console.log("=== TASK PROCESSING COMPLETED ===");
    }
  };
  
  useEffect(() => {
    console.log("RegistrationProgressReport effect - authIsLoading:", authIsLoading, "user:", user?.id);
    
    // Only fetch when auth is done loading and we have a user
    if (!authIsLoading && user?.id) {
      fetchRegistrationStatus();
    } else if (!authIsLoading && !user?.id) {
      // Auth is done loading but no user - this shouldn't happen on this page
      console.log("Auth loaded but no user found");
      setIsFetching(false);
    }
  }, [user?.id, authIsLoading]);
  
  const handleCheckAgain = () => {
    console.log("=== CHECK AGAIN CLICKED ===");
    console.log("User ID:", user?.id);
    console.log("Current registration status:", registrationStatus);
    
    // First refresh the status, then trigger task processing
    fetchRegistrationStatus();
    
    // Then trigger task processing
    handleProcessRegistrationTasks();
    
    if (onCheckAgain) {
      onCheckAgain();
    }
  };
  
  const handleSignInWithDifferentAccount = async () => {
    try {
      setIsSigningOut(true);
      
      // Clear registration progress from localStorage
      localStorage.removeItem('registration_payment_pending');
      localStorage.removeItem('registration_payment_complete');
      
      // Sign out the current user
      await signOut();
      
      // Redirect to the login page
      navigate("/auth");
    } catch (err) {
      console.error("Error signing out:", err);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSigningOut(false);
    }
  };
  
  console.log("Rendering RegistrationProgressReport - authIsLoading:", authIsLoading, "isFetching:", isFetching, "registrationStatus:", registrationStatus);
  
  // Show loading while auth is loading OR while fetching registration status
  if (authIsLoading || isFetching) {
    return (
      <Card className="bg-white">
        <CardContent className="pt-6 flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5]"></div>
        </CardContent>
      </Card>
    );
  }

  // If auth is done loading but no user, show error
  if (!authIsLoading && !user?.id) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>Please sign in to view registration status</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              You must be signed in to view your registration status.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={() => navigate("/auth")} className="w-full">
            Sign In
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Only show completion when ALL tasks are actually done
  if (registrationStatus && areAllTasksCompleted(registrationStatus)) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Registration Complete
          </CardTitle>
          <CardDescription>Your account setup is complete</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-800">
              Your registration is now complete! You will be redirected to the dashboard shortly.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => navigate("/dashboard")} 
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </CardFooter>
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
          
          {lastProcessingError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Last error: {lastProcessingError}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button 
            onClick={handleCheckAgain} 
            className="w-full"
            disabled={isProcessingTasks}
          >
            {isProcessingTasks ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Process Registration Tasks
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSignInWithDifferentAccount} 
            className="w-full"
            disabled={isSigningOut}
          >
            <LogIn className="mr-2 h-4 w-4" />
            {isSigningOut ? "Signing Out..." : "Sign In with Different Account"}
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
        
        {lastProcessingError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Processing error: {lastProcessingError}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-5 w-5 ${registrationStatus?.registration_status !== RegistrationStatusValues.PAYMENT_PENDING ? 'text-green-500' : 'text-gray-300'}`} />
              <span>Payment Completed</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {registrationStatus?.registration_status !== RegistrationStatusValues.PAYMENT_PENDING ? 'Completed' : 'Pending'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-5 w-5 ${
                registrationStatus?.tasks?.some(task => task.task_type === 'assign_care_team' && task.status === 'completed') ? 'text-green-500' : 'text-gray-300'
              }`} />
              <span>Care Team Assignment</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {registrationStatus?.tasks?.some(task => task.task_type === 'assign_care_team' && task.status === 'completed') ? 'Completed' : 'In Progress'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-5 w-5 ${
                registrationStatus?.tasks?.some(task => task.task_type === 'create_chat_room' && task.status === 'completed') ? 'text-green-500' : 'text-gray-300'
              }`} />
              <span>Chat Room Creation</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {registrationStatus?.tasks?.some(task => task.task_type === 'create_chat_room' && task.status === 'completed') ? 'Completed' : 'In Progress'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-5 w-5 ${
                registrationStatus?.tasks?.some(task => task.task_type === 'send_welcome_notification' && task.status === 'completed') ? 'text-green-500' : 'text-gray-300'
              }`} />
              <span>Welcome Notifications</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {registrationStatus?.tasks?.some(task => task.task_type === 'send_welcome_notification' && task.status === 'completed') ? 'Completed' : 'In Progress'}
            </span>
          </div>
          
          {/* Show task status if available */}
          {registrationStatus?.tasks && registrationStatus.tasks.length > 0 && (
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
      <CardFooter className="flex-col gap-2">
        <Button 
          onClick={handleCheckAgain}
          className="w-full"
          disabled={isProcessingTasks}
        >
          {isProcessingTasks ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Registration Tasks...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Process Registration Tasks
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleSignInWithDifferentAccount} 
          className="w-full"
          disabled={isSigningOut}
        >
          <LogIn className="mr-2 h-4 w-4" />
          {isSigningOut ? "Signing Out..." : "Sign In with Different Account"}
        </Button>
      </CardFooter>
    </Card>
  );
};
