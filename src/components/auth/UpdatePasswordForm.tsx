
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SupabaseAuthUI } from '@/components/auth/SupabaseAuthUI';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getEnvironmentInfo } from '@/utils/environmentUtils';

export const UpdatePasswordForm = () => {
  const [useCustomForm, setUseCustomForm] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  
  // Log environment info on mount for debugging
  useEffect(() => {
    const envInfo = getEnvironmentInfo();
    console.log("UpdatePasswordForm environment info:", envInfo);
  }, []);
  
  // Check if the token in the URL is valid
  useEffect(() => {
    const checkResetToken = async () => {
      try {
        // Log the URL hash if present
        const urlHash = window.location.hash;
        if (urlHash) {
          console.log("URL hash detected:", urlHash);
        }
        
        // This will check if there's a valid hash for password reset in the URL
        const { data, error } = await supabase.auth.getUser();
        
        console.log("Password reset token check:", { data, error });
        
        if (error) {
          console.error("Invalid or expired password reset token:", error);
          setIsTokenValid(false);
          toast.error("Password reset link is invalid or has expired");
        } else {
          console.log("Valid password reset token detected");
          setIsTokenValid(true);
        }
      } catch (error) {
        console.error("Error checking reset token:", error);
        setIsTokenValid(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    if (searchParams.get('type') === 'recovery') {
      checkResetToken();
    } else {
      setIsChecking(false);
    }
  }, [searchParams]);
  
  if (isChecking) {
    return (
      <div className="space-y-4 text-center">
        <p>Verifying your password reset link...</p>
      </div>
    );
  }
  
  if (isTokenValid === false) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid or Expired Link</AlertTitle>
          <AlertDescription>
            Your password reset link is invalid or has expired. Please request a new password reset link.
          </AlertDescription>
        </Alert>
        
        <Button
          className="w-full"
          onClick={() => navigate("/auth?mode=reset")}
        >
          Request New Password Reset Link
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => navigate("/auth")}
        >
          Back to Login
        </Button>
      </div>
    );
  }
  
  if (!useCustomForm) {
    return (
      <div className="space-y-4">
        <SupabaseAuthUI 
          view="update_password" 
          onSuccess={() => {
            toast.success("Password updated successfully!");
            navigate('/auth');
          }}
        />
        
        <div className="text-center mt-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/auth")}
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }
  
  // Fallback to original implementation if needed
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertDescription>
          The custom password update form is currently unavailable. 
          Please use the Supabase Auth UI.
        </AlertDescription>
      </Alert>
      
      <Button
        className="w-full"
        onClick={() => setUseCustomForm(false)}
      >
        Return to Password Reset
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => navigate("/auth")}
      >
        Back to Login
      </Button>
    </div>
  );
};
