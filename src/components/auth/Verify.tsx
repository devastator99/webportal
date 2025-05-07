
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserRegistrationStatus } from '@/types/registration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const VerifyRegistration: React.FC = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<UserRegistrationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const verifyRegistrationStatus = async () => {
      if (!user?.id || userRole !== 'patient') {
        setIsVerifying(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.rpc('get_user_registration_status', {
          p_user_id: user.id
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        const status = data as unknown as UserRegistrationStatus;
        setRegistrationStatus(status);
        
        // If payment is pending, redirect to registration page
        if (status.registration_status === 'payment_pending') {
          localStorage.setItem('registration_payment_pending', 'true');
          localStorage.setItem('registration_payment_complete', 'false');
          navigate('/auth/register', { replace: true });
          return;
        }
        
        if (['payment_complete', 'care_team_assigned'].includes(status.registration_status)) {
          localStorage.setItem('registration_payment_pending', 'false');
          localStorage.setItem('registration_payment_complete', 'true');
        } else if (status.registration_status === 'fully_registered') {
          // For fully registered users, clean up localStorage flags
          localStorage.removeItem('registration_payment_pending');
          localStorage.removeItem('registration_payment_complete');
        }
      } catch (err) {
        console.error('Error verifying registration:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify registration status');
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyRegistrationStatus();
  }, [user, userRole, navigate]);
  
  if (isVerifying) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5]"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Error</CardTitle>
          <CardDescription>There was a problem checking your registration status</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.location.reload()} className="w-full">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (!registrationStatus || registrationStatus.registration_status === 'fully_registered') {
    return null; // Registration is complete or not applicable, don't show anything
  }
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Complete Your Registration</CardTitle>
        <CardDescription>
          {registrationStatus.registration_status === 'payment_pending' 
            ? 'Payment required to complete registration' 
            : 'Your registration is being processed'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertDescription>
            {registrationStatus.registration_status === 'payment_pending' 
              ? 'You need to complete the payment step to finish your registration.' 
              : 'Your payment has been processed. Your care team is now being assigned.'}
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => navigate('/auth/register')} 
          className="w-full"
        >
          {registrationStatus.registration_status === 'payment_pending' 
            ? 'Make Payment' 
            : 'View Registration Status'}
        </Button>
      </CardFooter>
    </Card>
  );
};
