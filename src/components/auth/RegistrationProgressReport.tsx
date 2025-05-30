
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Users, MessageSquare, ArrowRight, Loader2, AlertCircle, LogOut, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserRegistrationStatus, RegistrationStatusValues } from '@/types/registration';

interface RegistrationProgressReportProps {
  onComplete?: () => void;
  userRole?: string | null;
}

export const RegistrationProgressReport: React.FC<RegistrationProgressReportProps> = ({
  onComplete,
  userRole
}) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<UserRegistrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState<number | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTime = 5 * 60 * 1000; // 5 minutes timeout

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
        setFailureCount(prev => prev + 1);
        
        if (failureCount >= 3) {
          toast({
            title: "Connection Issues",
            description: "Having trouble checking your registration status. You can try refreshing or sign out and check back later.",
            variant: "destructive"
          });
        }
        return;
      }
      
      const regStatus = data as unknown as UserRegistrationStatus;
      console.log("Registration status:", regStatus);
      setStatus(regStatus);
      setFailureCount(0); // Reset failure count on success
      
      // Check if registration is complete based on role
      if (regStatus.registration_status === RegistrationStatusValues.FULLY_REGISTERED) {
        // For patients, check all required tasks
        if (userRole === 'patient') {
          const requiredTaskTypes = ['assign_care_team', 'create_chat_room', 'send_welcome_notification'];
          const completedTasks = regStatus.tasks?.filter(task => task.status === 'completed') || [];
          const completedTaskTypes = completedTasks.map(task => task.task_type);
          
          const allRequiredTasksCompleted = requiredTaskTypes.every(taskType => 
            completedTaskTypes.includes(taskType)
          );
          
          if (allRequiredTasksCompleted) {
            setAutoRedirectCountdown(5);
            clearTimeout(timeoutRef.current!);
          }
        } else {
          // For non-patients, check if welcome notification is sent
          const welcomeTask = regStatus.tasks?.find(task => task.task_type === 'send_welcome_notification');
          if (welcomeTask?.status === 'completed') {
            setAutoRedirectCountdown(5);
            clearTimeout(timeoutRef.current!);
          }
        }
      }
      
    } catch (err: any) {
      console.error("Exception fetching registration status:", err);
      setFailureCount(prev => prev + 1);
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

  // Set up timeout for registration process
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIsTimedOut(true);
      toast({
        title: "Registration Taking Longer Than Expected",
        description: "Your registration is taking longer than usual. You can continue waiting, refresh, or sign out and check back later.",
        variant: "destructive"
      });
    }, maxWaitTime);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchStatus();
    
    // Set up periodic polling if registration is not complete
    const pollInterval = setInterval(() => {
      if (!autoRedirectCountdown && !isTimedOut) {
        fetchStatus();
      }
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(pollInterval);
  }, [user]);

  const handleManualComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleRefresh = () => {
    setFailureCount(0);
    setIsTimedOut(false);
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
      
      // Keep registration state for resuming later
      // Don't clear localStorage flags here
      
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

  // Trigger manual task processing for stuck registrations
  const handleRetryTasks = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('trigger-registration-notifications', {
        body: { patient_id: user.id }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Tasks Restarted",
        description: "Registration tasks have been restarted. Please wait a moment and check again.",
      });
      
      // Wait a bit then refresh status
      setTimeout(() => {
        fetchStatus();
      }, 3000);
      
    } catch (error: any) {
      console.error("Error restarting tasks:", error);
      toast({
        title: "Retry Failed",
        description: "Could not restart registration tasks. Please try refreshing or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get role-specific messaging
  const getRoleSpecificContent = () => {
    switch (userRole) {
      case 'patient':
        return {
          title: '🎉 Registration In Progress',
          description: 'Your account setup is being processed. Here\'s what\'s happening:',
          tasks: [
            { type: 'assign_care_team', title: 'Care Team Assignment', description: 'Assigning your personal doctor and nutritionist' },
            { type: 'create_chat_room', title: 'Communication Setup', description: 'Setting up secure messaging with your care team' },
            { type: 'send_welcome_notification', title: 'Welcome Notification', description: 'Sending your personalized welcome notification' }
          ]
        };
      case 'doctor':
        return {
          title: '🩺 Doctor Account Setup',
          description: 'Setting up your doctor profile and permissions:',
          tasks: [
            { type: 'send_welcome_notification', title: 'Profile Setup', description: 'Configuring your doctor profile and permissions' }
          ]
        };
      case 'nutritionist':
        return {
          title: '🥗 Nutritionist Account Setup',
          description: 'Setting up your nutritionist profile and permissions:',
          tasks: [
            { type: 'send_welcome_notification', title: 'Profile Setup', description: 'Configuring your nutritionist profile and permissions' }
          ]
        };
      case 'administrator':
        return {
          title: '👨‍💼 Administrator Account Setup',
          description: 'Setting up your administrator access and permissions:',
          tasks: [
            { type: 'send_welcome_notification', title: 'Admin Setup', description: 'Configuring administrator access and system permissions' }
          ]
        };
      case 'reception':
        return {
          title: '📋 Reception Account Setup',
          description: 'Setting up your reception access and permissions:',
          tasks: [
            { type: 'send_welcome_notification', title: 'Reception Setup', description: 'Configuring reception access and appointment management permissions' }
          ]
        };
      default:
        return {
          title: '⚙️ Account Setup',
          description: 'Setting up your account and permissions:',
          tasks: [
            { type: 'send_welcome_notification', title: 'Account Setup', description: 'Configuring your account and permissions' }
          ]
        };
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
          <div className="flex gap-2 justify-center">
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const roleContent = getRoleSpecificContent();
  const tasks = status.tasks || [];

  // Check if registration is complete
  const isComplete = status.registration_status === RegistrationStatusValues.FULLY_REGISTERED &&
    (userRole === 'patient' ? 
      tasks.some(task => task.task_type === 'send_welcome_notification' && task.status === 'completed') :
      tasks.some(task => task.task_type === 'send_welcome_notification' && task.status === 'completed')
    );

  return (
    <Card className="bg-white shadow-lg border border-gray-100">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-green-600">
          {roleContent.title}
        </CardTitle>
        <p className="text-gray-600">
          {roleContent.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment confirmation for patients */}
        {userRole === 'patient' && (
          <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-800">Payment Processed</h3>
              <p className="text-sm text-green-700">Your registration fee has been successfully processed</p>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="space-y-4">
          {roleContent.tasks.map((taskConfig, index) => {
            const actualTask = tasks.find(t => t.task_type === taskConfig.type);
            const isCompleted = actualTask?.status === 'completed';
            const isFailed = actualTask?.status === 'failed';
            
            return (
              <div key={taskConfig.type} className={`flex items-center gap-4 p-4 rounded-lg border ${
                isCompleted 
                  ? 'bg-green-50 border-green-200' 
                  : isFailed
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : isFailed ? (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    isCompleted ? 'text-green-800' : 
                    isFailed ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    {taskConfig.title}
                  </h3>
                  <p className={`text-sm ${
                    isCompleted ? 'text-green-700' : 
                    isFailed ? 'text-red-700' : 'text-blue-700'
                  }`}>
                    {isCompleted 
                      ? `${taskConfig.description} - Complete!`
                      : isFailed
                      ? `${taskConfig.description} - Retrying...`
                      : taskConfig.description
                    }
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeout warning */}
        {isTimedOut && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">
              ⏰ Taking Longer Than Expected
            </h3>
            <p className="text-orange-700 text-sm mb-3">
              Your registration is taking longer than usual. This sometimes happens during high traffic periods.
            </p>
            <Button 
              onClick={handleRetryTasks}
              disabled={isRefreshing}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Retry Setup
            </Button>
          </div>
        )}

        {/* Auto-redirect countdown */}
        {autoRedirectCountdown !== null && isComplete && (
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
            <h3 className="font-semibold text-purple-800 mb-2">
              🎉 Setup Complete!
            </h3>
            <p className="text-purple-700 mb-3">
              Your account is ready! Redirecting to your dashboard in {autoRedirectCountdown} seconds...
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
        {!isComplete && (
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
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Status
                  </>
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
                    Sign Out
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              <p>Setup tasks are processing automatically in the background.</p>
              <p className="font-medium text-purple-700">
                You can sign out and the setup will continue. Log back in anytime to check progress.
              </p>
            </div>
          </div>
        )}

        {/* Manual redirect for completed registration */}
        {isComplete && autoRedirectCountdown === null && (
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
