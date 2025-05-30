
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onVerified,
  onBack
}) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check verification status periodically
    const checkVerification = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email_confirmed_at) {
          setIsVerified(true);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    const interval = setInterval(checkVerification, 3000);
    checkVerification(); // Check immediately

    return () => clearInterval(interval);
  }, []);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Verification email sent",
        description: "Please check your email for the verification link",
      });
    } catch (error: any) {
      toast({
        title: "Error sending email",
        description: error.message || "Failed to resend verification email",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        setIsVerified(true);
        toast({
          title: "Email verified!",
          description: "Your email has been successfully verified",
        });
      } else {
        toast({
          title: "Not verified yet",
          description: "Please check your email and click the verification link",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error checking status",
        description: error.message || "Failed to check verification status",
        variant: "destructive"
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSkipForNow = () => {
    // For development/testing purposes, allow skipping verification
    if (process.env.NODE_ENV === 'development') {
      toast({
        title: "Skipping verification (Development)",
        description: "Proceeding without email verification for testing",
      });
      onVerified();
    }
  };

  return (
    <Card className="bg-white shadow-lg border border-gray-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Verification Required
        </CardTitle>
        <p className="text-sm text-gray-600">
          We've sent a verification link to your email address
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="bg-blue-50 p-6 rounded-lg">
            <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-800 mb-2">
              Check Your Email
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              We've sent a verification link to:
            </p>
            <p className="font-medium text-purple-600 bg-white px-3 py-2 rounded border">
              {email}
            </p>
          </div>

          {isVerified ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your email has been verified! You can now proceed to payment.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Please check your email and click the verification link. You may need to check your spam folder.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <p className="mb-2">After clicking the verification link:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your email will be verified automatically</li>
              <li>You'll be able to proceed to payment</li>
              <li>Your account setup will be complete</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t">
          {isVerified ? (
            <Button
              onClick={onVerified}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Continue to Payment
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCheckStatus}
                disabled={checkingStatus}
                className="w-full"
              >
                {checkingStatus ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Check Verification Status
              </Button>
              
              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={isResending}
              >
                {isResending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Resend Verification Email
              </Button>
            </>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              Go Back
            </Button>
            
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="ghost"
                onClick={handleSkipForNow}
                className="flex-1 text-sm"
              >
                Skip for Testing
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
