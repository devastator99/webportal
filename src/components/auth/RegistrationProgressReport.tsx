import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Users, MessageSquare, ArrowRight, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserRegistrationStatus, RegistrationStatusValues } from '@/types/registration';

interface RegistrationProgressReportProps {
  onComplete?: () => void;
}

export const RegistrationProgressReport: React.FC<RegistrationProgressReportProps> = ({
  onComplete
}) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<UserRegistrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState<number | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const fetchStatus = async (showLoadingToast = false) => {
    if (!user) return;
    
    if (showLoadingToast) {
      setIsRefreshing(true);
    }
    
    try {
      const { data, error } = await supabase.rpc('get_user_registration_status_safe', {
        p_user_id: user.id
      });
      
      if (error) {
        console.error("Error fetching registration status:", error);
        toast({
          title: "Error",
          description: "Failed to fetch registration status",
          variant: "destructive"
        });
        return;
      }
      
      const regStatus = data as unknown as UserRegistrationStatus;
      console.log("Registration status:", regStatus);
      setStatus(regStatus);
      
      // Check if registration is truly complete - ALL required tasks must be completed
      if (regStatus.registration_status === RegistrationStatusValues.FULLY_REGISTERED) {
        const requiredTaskTypes = ['assign_care_team', 'create_chat_room', 'send_welcome_notification'];
        const completedTasks = regStatus.tasks?.filter(task => task.status === 'completed') || [];
        const completedTaskTypes = completedTasks.map(task => task.task_type);
        
        // ALL required tasks must be completed, including welcome notification
        const allRequiredTasksCompleted = requiredTaskTypes.every(taskType => 
          completedTaskTypes.includes(taskType)
        );
        
        console.log("Registration completion check:", {
          isFullyRegistered: regStatus.registration_status === RegistrationStatusValues.FULLY_REGISTERED,
          allRequiredTasksCompleted,
          completedTaskTypes,
          requiredTaskTypes,
          welcomeNotificationSent: completedTaskTypes.includes('send_welcome_notification')
        });
        
        // Only start countdown if ALL tasks including welcome notification are complete
        if (allRequiredTasksCompleted) {
          // Start 5-second countdown
          setAutoRedirectCountdown(5);
        }
      }
      
    } catch (err: any) {
      console.error("Exception fetching registration status:", err);
      toast({
        title: "Error",
        description: "Failed to fetch registration status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Auto-redirect countdown effect
  useEffect(() => {
    if (autoRedirectCountdown === null) return;
    
    if (autoRedirectCountdown <= 0) {
      if (onComplete) {
        onComplete();
      }
      return;
    }
    
    const timer = setTimeout(() => {
      setAutoRedirectCountdown(autoRedirectCountdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [autoRedirectCountdown, onComplete]);

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const handleManualComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleRefresh = () => {
    fetchStatus(true);
  };

  const handleLogout = async () => {
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      
      toast({
        title: "Logging out",
        description: "Your registration will continue in the background. You can log back in anytime to check the status.",
      });
      
      // Clear localStorage flags but keep registration processing
      localStorage.removeItem('registration_payment_complete');
      
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-lg border border-gray-100">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-600">Checking your registration status...</p>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="bg-white shadow-lg border border-gray-100">
        <CardContent className="text-center py-12">
          <p className="text-gray-600 mb-4">Unable to fetch registration status</p>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const tasks = status.tasks || [];
  const careTeamTask = tasks.find(t => t.task_type === 'assign_care_team');
  const chatRoomTask = tasks.find(t => t.task_type === 'create_chat_room');
  const welcomeTask = tasks.find(t => t.task_type === 'send_welcome_notification');

  // Registration is only complete if ALL tasks are completed, especially the welcome notification
  const isFullyComplete = status.registration_status === RegistrationStatusValues.FULLY_REGISTERED &&
    careTeamTask?.status === 'completed' &&
    chatRoomTask?.status === 'completed' &&
    welcomeTask?.status === 'completed';

  // Check if any task failed
  const hasFailedTasks = tasks.some(task => task.status === 'failed');

  return (
    <Card className="bg-white shadow-lg border border-gray-100">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-green-600">
          🎉 Registration In Progress
        </CardTitle>
        <p className="text-gray-600">
          Your account setup is being processed. Here's what's happening:
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="space-y-4">
          {/* Payment */}
          <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-800">Payment Processed</h3>
              <p className="text-sm text-green-700">Your registration fee has been successfully processed</p>
            </div>
          </div>

          {/* Care Team Assignment */}
          <div className={`flex items-center gap-4 p-4 rounded-lg border ${
            careTeamTask?.status === 'completed' 
              ? 'bg-green-50 border-green-200' 
              : careTeamTask?.status === 'failed'
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            {careTeamTask?.status === 'completed' ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : careTeamTask?.status === 'failed' ? (
              <AlertCircle className="h-6 w-6 text-red-600" />
            ) : (
              <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${
                careTeamTask?.status === 'completed' ? 'text-green-800' : 
                careTeamTask?.status === 'failed' ? 'text-red-800' : 'text-blue-800'
              }`}>
                Care Team Assignment
              </h3>
              <p className={`text-sm ${
                careTeamTask?.status === 'completed' ? 'text-green-700' : 
                careTeamTask?.status === 'failed' ? 'text-red-700' : 'text-blue-700'
              }`}>
                {careTeamTask?.status === 'completed' 
                  ? 'Your dedicated doctor and nutritionist have been assigned'
                  : careTeamTask?.status === 'failed'
                  ? 'There was an issue assigning your care team. Our team is working to resolve this.'
                  : 'Assigning your personal doctor and nutritionist'
                }
              </p>
            </div>
          </div>

          {/* Chat Room Setup */}
          <div className={`flex items-center gap-4 p-4 rounded-lg border ${
            chatRoomTask?.status === 'completed' 
              ? 'bg-green-50 border-green-200' 
              : chatRoomTask?.status === 'failed'
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            {chatRoomTask?.status === 'completed' ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : chatRoomTask?.status === 'failed' ? (
              <AlertCircle className="h-6 w-6 text-red-600" />
            ) : (
              <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${
                chatRoomTask?.status === 'completed' ? 'text-green-800' : 
                chatRoomTask?.status === 'failed' ? 'text-red-800' : 'text-blue-800'
              }`}>
                Communication Setup
              </h3>
              <p className={`text-sm ${
                chatRoomTask?.status === 'completed' ? 'text-green-700' : 
                chatRoomTask?.status === 'failed' ? 'text-red-700' : 'text-blue-700'
              }`}>
                {chatRoomTask?.status === 'completed' 
                  ? 'Your secure chat room with the care team is ready'
                  : chatRoomTask?.status === 'failed'
                  ? 'There was an issue setting up your communication channel. Retrying...'
                  : 'Setting up secure messaging with your care team'
                }
              </p>
            </div>
          </div>

          {/* Welcome Message - CRITICAL FOR COMPLETION */}
          <div className={`flex items-center gap-4 p-4 rounded-lg border ${
            welcomeTask?.status === 'completed' 
              ? 'bg-green-50 border-green-200' 
              : welcomeTask?.status === 'failed'
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            {welcomeTask?.status === 'completed' ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : welcomeTask?.status === 'failed' ? (
              <AlertCircle className="h-6 w-6 text-red-600" />
            ) : (
              <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${
                welcomeTask?.status === 'completed' ? 'text-green-800' : 
                welcomeTask?.status === 'failed' ? 'text-red-800' : 'text-blue-800'
              }`}>
                Welcome Notification
              </h3>
              <p className={`text-sm ${
                welcomeTask?.status === 'completed' ? 'text-green-700' : 
                welcomeTask?.status === 'failed' ? 'text-red-700' : 'text-blue-700'
              }`}>
                {welcomeTask?.status === 'completed' 
                  ? 'Welcome notifications sent successfully to your email and phone'
                  : welcomeTask?.status === 'failed'
                  ? 'There was an issue sending your welcome notification. Retrying...'
                  : 'Sending your personalized welcome notification'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Auto-redirect countdown - ONLY show when ALL tasks including notification are complete */}
        {autoRedirectCountdown !== null && isFullyComplete && (
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
            <h3 className="font-semibold text-purple-800 mb-2">
              🎉 Registration Complete!
            </h3>
            <p className="text-purple-700 mb-3">
              All setup tasks including welcome notification have been completed successfully! Redirecting to your dashboard in {autoRedirectCountdown} seconds...
            </p>
            <Button 
              onClick={handleManualComplete}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Go to Dashboard Now <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Actions for incomplete registration */}
        {!isFullyComplete && (
          <div className="flex flex-col gap-3 pt-4 border-t">
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="flex-1"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  'Refresh Status'
                )}
              </Button>
              
              <Button
                onClick={handleLogout}
                disabled={isSigningOut}
                variant="outline"
                className="flex-1"
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing Out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              <p>Setup tasks are processing automatically in the background.</p>
              <p className="font-medium text-purple-700">
                You can log out and the registration will continue. Log back in anytime to check progress.
              </p>
              {hasFailedTasks && (
                <p className="text-red-600 font-medium mt-2">
                  Some tasks encountered issues and are being retried automatically.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Manual redirect for completed registration */}
        {isFullyComplete && autoRedirectCountdown === null && (
          <div className="pt-4 border-t">
            <Button 
              onClick={handleManualComplete}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Access Your Dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
