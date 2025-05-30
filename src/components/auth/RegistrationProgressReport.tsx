
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Users, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { UserRegistrationStatus, RegistrationStatusValues } from '@/types/registration';

interface RegistrationProgressReportProps {
  onCheckAgain?: () => void;
}

export const RegistrationProgressReport: React.FC<RegistrationProgressReportProps> = ({
  onCheckAgain
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<UserRegistrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState<number | null>(null);

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
      
      // If fully registered, start countdown for auto-redirect
      if (regStatus.registration_status === RegistrationStatusValues.FULLY_REGISTERED) {
        const requiredTaskTypes = ['assign_care_team', 'create_chat_room', 'send_welcome_notification'];
        const completedTasks = regStatus.tasks?.filter(task => task.status === 'completed') || [];
        const completedTaskTypes = completedTasks.map(task => task.task_type);
        const allRequiredTasksCompleted = requiredTaskTypes.every(taskType => 
          completedTaskTypes.includes(taskType)
        );
        
        if (allRequiredTasksCompleted) {
          // Clear localStorage flags
          localStorage.removeItem('registration_payment_pending');
          localStorage.removeItem('registration_payment_complete');
          
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
      toast({
        title: "Welcome to your Health Dashboard!",
        description: "Registration completed successfully. Redirecting...",
      });
      navigate('/dashboard', { replace: true });
      return;
    }
    
    const timer = setTimeout(() => {
      setAutoRedirectCountdown(autoRedirectCountdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [autoRedirectCountdown, navigate, toast]);

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const handleManualRedirect = () => {
    // Clear localStorage flags
    localStorage.removeItem('registration_payment_pending');
    localStorage.removeItem('registration_payment_complete');
    
    toast({
      title: "Welcome to your Health Dashboard!",
      description: "Registration completed successfully.",
    });
    navigate('/dashboard', { replace: true });
  };

  const handleRefresh = () => {
    fetchStatus(true);
    if (onCheckAgain) {
      onCheckAgain();
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

  const isFullyComplete = status.registration_status === RegistrationStatusValues.FULLY_REGISTERED &&
    careTeamTask?.status === 'completed' &&
    chatRoomTask?.status === 'completed' &&
    welcomeTask?.status === 'completed';

  return (
    <Card className="bg-white shadow-lg border border-gray-100">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-green-600">
          🎉 Registration Complete!
        </CardTitle>
        <p className="text-gray-600">
          Your account setup is in progress. Here's what's happening:
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
              : 'bg-blue-50 border-blue-200'
          }`}>
            {careTeamTask?.status === 'completed' ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${
                careTeamTask?.status === 'completed' ? 'text-green-800' : 'text-blue-800'
              }`}>
                Care Team Assignment
              </h3>
              <p className={`text-sm ${
                careTeamTask?.status === 'completed' ? 'text-green-700' : 'text-blue-700'
              }`}>
                {careTeamTask?.status === 'completed' 
                  ? 'Your dedicated doctor and nutritionist have been assigned'
                  : 'Assigning your personal doctor and nutritionist (typically takes 2-4 hours)'
                }
              </p>
            </div>
          </div>

          {/* Chat Room Setup */}
          <div className={`flex items-center gap-4 p-4 rounded-lg border ${
            chatRoomTask?.status === 'completed' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            {chatRoomTask?.status === 'completed' ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${
                chatRoomTask?.status === 'completed' ? 'text-green-800' : 'text-blue-800'
              }`}>
                Communication Setup
              </h3>
              <p className={`text-sm ${
                chatRoomTask?.status === 'completed' ? 'text-green-700' : 'text-blue-700'
              }`}>
                {chatRoomTask?.status === 'completed' 
                  ? 'Your secure chat room with the care team is ready'
                  : 'Setting up secure messaging with your care team'
                }
              </p>
            </div>
          </div>

          {/* Welcome Message */}
          <div className={`flex items-center gap-4 p-4 rounded-lg border ${
            welcomeTask?.status === 'completed' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            {welcomeTask?.status === 'completed' ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${
                welcomeTask?.status === 'completed' ? 'text-green-800' : 'text-blue-800'
              }`}>
                Welcome Message
              </h3>
              <p className={`text-sm ${
                welcomeTask?.status === 'completed' ? 'text-green-700' : 'text-blue-700'
              }`}>
                {welcomeTask?.status === 'completed' 
                  ? 'Welcome message sent to your dashboard'
                  : 'Preparing your personalized welcome message'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Auto-redirect countdown */}
        {autoRedirectCountdown !== null && (
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
            <h3 className="font-semibold text-purple-800 mb-2">
              🎉 Everything is Ready!
            </h3>
            <p className="text-purple-700 mb-3">
              Automatically redirecting to your dashboard in {autoRedirectCountdown} seconds...
            </p>
            <Button 
              onClick={handleManualRedirect}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Go to Dashboard Now <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Actions */}
        {!isFullyComplete && (
          <div className="flex flex-col gap-3 pt-4 border-t">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="w-full"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Checking Status...
                </>
              ) : (
                'Refresh Status'
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              <p>Most tasks complete within 2-4 hours during business hours.</p>
              <p>You'll receive notifications when everything is ready!</p>
            </div>
          </div>
        )}

        {isFullyComplete && autoRedirectCountdown === null && (
          <div className="pt-4 border-t">
            <Button 
              onClick={handleManualRedirect}
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
