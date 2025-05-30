
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRegistrationProcess } from '@/hooks/useRegistrationProcess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, CreditCard, Users, RefreshCw } from 'lucide-react';
import { RegistrationPayment } from '@/components/auth/RegistrationPayment';
import { toast } from '@/hooks/use-toast';

interface EnhancedRegistrationProgressProps {
  onComplete?: () => void;
  userRole?: string | null;
}

export const EnhancedRegistrationProgress: React.FC<EnhancedRegistrationProgressProps> = ({
  onComplete,
  userRole
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'payment' | 'progress' | 'complete'>('payment');
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    registrationProgress,
    fetchRegistrationProgress,
    isLoading,
    triggerTaskProcessing,
    startPollingRegistrationStatus,
    stopPollingRegistrationStatus
  } = useRegistrationProcess();

  // Check registration status on mount
  useEffect(() => {
    if (user?.id) {
      console.log("Checking registration status for user:", user.id);
      fetchRegistrationProgress();
    }
  }, [user?.id, fetchRegistrationProgress]);

  // Determine current step based on registration status
  useEffect(() => {
    if (registrationProgress) {
      console.log("Registration progress:", registrationProgress);
      
      if (registrationProgress.status === 'payment_pending') {
        setCurrentStep('payment');
      } else if (registrationProgress.status === 'fully_registered') {
        setCurrentStep('complete');
        // Auto-complete after a delay
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      } else {
        setCurrentStep('progress');
        // Start polling for updates
        startPollingRegistrationStatus();
      }
    }
  }, [registrationProgress, onComplete, startPollingRegistrationStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPollingRegistrationStatus();
    };
  }, [stopPollingRegistrationStatus]);

  const handlePaymentComplete = () => {
    console.log("Payment completed, updating status");
    setCurrentStep('progress');
    fetchRegistrationProgress();
    startPollingRegistrationStatus();
    
    toast({
      title: "Payment Successful",
      description: "Your care team is being assigned. This may take a few minutes.",
    });
  };

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    await fetchRegistrationProgress();
    await triggerTaskProcessing();
    setRefreshing(false);
  };

  // Show payment step for patients who haven't paid yet
  if (currentStep === 'payment' && userRole === 'patient') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <CreditCard className="h-6 w-6 text-purple-600" />
            Complete Your Registration
          </CardTitle>
          <CardDescription>
            Please complete your payment to finish the registration process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationPayment 
            onComplete={handlePaymentComplete}
            registrationFee={500}
          />
        </CardContent>
      </Card>
    );
  }

  // Show completion step
  if (currentStep === 'complete') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Registration Complete!
          </CardTitle>
          <CardDescription>
            Your account is fully set up and ready to use
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <Progress value={100} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Redirecting to your dashboard...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show progress step (default)
  const getProgressValue = () => {
    if (!registrationProgress) return 25;
    
    switch (registrationProgress.status) {
      case 'payment_complete':
        return 50;
      case 'care_team_assigned':
        return 75;
      case 'fully_registered':
        return 100;
      default:
        return 25;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Users className="h-6 w-6 text-purple-600" />
          Setting Up Your Account
        </CardTitle>
        <CardDescription>
          We're preparing your personalized healthcare experience
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Registration Progress</span>
            <span>{getProgressValue()}% Complete</span>
          </div>
          <Progress value={getProgressValue()} className="w-full" />
        </div>

        {/* Status Message */}
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-700">
            {registrationProgress?.status === 'payment_complete' && 
              "Payment received! Assigning your care team..."}
            {registrationProgress?.status === 'care_team_assigned' && 
              "Care team assigned! Finalizing your setup..."}
            {!registrationProgress?.status && "Loading registration status..."}
          </p>
        </div>

        {/* Tasks List */}
        {registrationProgress?.tasks && registrationProgress.tasks.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Setup Tasks:</h4>
            {registrationProgress.tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(task.status)}
                  <span className="text-sm font-medium">
                    {task.task_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                {getStatusBadge(task.status)}
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={handleRefreshStatus}
            disabled={refreshing || isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${(refreshing || isLoading) ? 'animate-spin' : ''}`} />
            {refreshing || isLoading ? 'Refreshing...' : 'Refresh Status'}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center text-xs text-muted-foreground">
          This process usually takes 2-5 minutes. You'll be automatically redirected when complete.
        </div>
      </CardContent>
    </Card>
  );
};
