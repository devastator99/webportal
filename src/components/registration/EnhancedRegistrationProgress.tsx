
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  LogOut, 
  RefreshCw,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';
import { useEnhancedRegistrationProcess } from '@/hooks/useEnhancedRegistrationProcess';
import { registrationErrorHandler } from '@/utils/registrationErrorHandler';

interface EnhancedRegistrationProgressProps {
  onComplete?: () => void;
  userRole?: string | null;
}

export const EnhancedRegistrationProgress: React.FC<EnhancedRegistrationProgressProps> = ({
  onComplete,
  userRole
}) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState<number | null>(null);

  const {
    registrationProgress,
    triggerTaskProcessing,
    fetchRegistrationStatus,
    isLoading,
    error,
    isPolling,
    pollingState,
    enhancedState
  } = useEnhancedRegistrationProcess();

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

  // Check if registration is complete
  useEffect(() => {
    if (registrationProgress?.status === 'fully_registered') {
      const tasks = registrationProgress.tasks || [];
      const requiredTaskTypes = ['assign_care_team', 'create_chat_room', 'send_welcome_notification'];
      const completedTasks = tasks.filter(task => task.status === 'completed');
      const completedTaskTypes = completedTasks.map(task => task.task_type);
      
      const allRequiredCompleted = requiredTaskTypes.every(taskType => 
        completedTaskTypes.includes(taskType)
      );
      
      if (allRequiredCompleted && autoRedirectCountdown === null) {
        setAutoRedirectCountdown(5);
      }
    }
  }, [registrationProgress, autoRedirectCountdown]);

  const handleManualComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleRefresh = async () => {
    await fetchRegistrationStatus();
  };

  const handleRetryTasks = async () => {
    await triggerTaskProcessing();
  };

  const handleLogout = async () => {
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      
      toast({
        title: "Signing out",
        description: "Your registration will continue in the background.",
      });
      
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

  // Get role-specific content
  const getRoleSpecificContent = () => {
    switch (userRole) {
      case 'patient':
        return {
          title: '🎉 Patient Registration In Progress',
          description: 'Your account setup is being processed. Here\'s what\'s happening:',
          tasks: [
            { type: 'assign_care_team', title: 'Care Team Assignment', description: 'Assigning your personal doctor and nutritionist' },
            { type: 'create_chat_room', title: 'Communication Setup', description: 'Setting up secure messaging with your care team' },
            { type: 'send_welcome_notification', title: 'Welcome Notification', description: 'Sending your personalized welcome notification' }
          ]
        };
      default:
        return {
          title: '⚙️ Account Setup In Progress',
          description: 'Setting up your account and permissions:',
          tasks: [
            { type: 'send_welcome_notification', title: 'Account Setup', description: 'Configuring your account and permissions' }
          ]
        };
    }
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!registrationProgress?.tasks) return 0;
    
    const roleContent = getRoleSpecificContent();
    const totalTasks = roleContent.tasks.length;
    const completedTasks = registrationProgress.tasks.filter(task => task.status === 'completed').length;
    
    return Math.round((completedTasks / totalTasks) * 100);
  };

  // Get connection status indicator
  const getConnectionStatus = () => {
    if (error && registrationErrorHandler.categorizeError({ message: error }) === 'network') {
      return { icon: WifiOff, color: 'text-red-500', label: 'Connection Issues' };
    }
    
    if (isPolling) {
      return { icon: Activity, color: 'text-green-500', label: 'Live Updates Active' };
    }
    
    return { icon: Wifi, color: 'text-blue-500', label: 'Connected' };
  };

  if (isLoading && !registrationProgress) {
    return (
      <Card className="bg-white shadow-lg border border-gray-100">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-600">Checking your registration status...</p>
        </CardContent>
      </Card>
    );
  }

  const roleContent = getRoleSpecificContent();
  const tasks = registrationProgress?.tasks || [];
  const progress = calculateProgress();
  const connectionStatus = getConnectionStatus();
  const isComplete = progress === 100;

  return (
    <Card className="bg-white shadow-lg border border-gray-100">
      <CardHeader className="text-center">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="flex items-center gap-2">
            <connectionStatus.icon className={`h-4 w-4 ${connectionStatus.color}`} />
            {connectionStatus.label}
          </Badge>
          {isPolling && (
            <Badge variant="outline" className="flex items-center gap-2">
              <Activity className="h-3 w-3 animate-pulse" />
              Polling every {Math.round(pollingState.currentInterval / 1000)}s
            </Badge>
          )}
        </div>
        
        <CardTitle className="text-2xl text-green-600">
          {roleContent.title}
        </CardTitle>
        <p className="text-gray-600">
          {roleContent.description}
        </p>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
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
            const isPending = actualTask?.status === 'pending' || !actualTask;
            
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
                <Badge variant={isCompleted ? 'default' : isFailed ? 'destructive' : 'secondary'}>
                  {isCompleted ? 'Done' : isFailed ? 'Retry' : 'Processing'}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">
              ⚠️ {registrationErrorHandler.categorizeError({ message: error }) === 'network' ? 'Connection Issue' : 'Processing Issue'}
            </h3>
            <p className="text-red-700 text-sm mb-3">{error}</p>
            <Button 
              onClick={handleRetryTasks}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Retry Now
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
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
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
                Current attempt: {pollingState.attemptCount}, Next check in: {Math.round(pollingState.currentInterval / 1000)}s
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
