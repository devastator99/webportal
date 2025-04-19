
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { toast } from "sonner";
import { getAuthRedirectUrl, getEnvironmentInfo } from "@/utils/environmentUtils";

interface PasswordResetFormProps {
  initialEmail?: string;
}

export const PasswordResetForm = ({ initialEmail = "" }: PasswordResetFormProps) => {
  const [useCustomForm, setUseCustomForm] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetSent = searchParams.get('reset_sent') === 'true';
  
  useEffect(() => {
    // Log environment info on component mount to help with debugging
    const envInfo = getEnvironmentInfo();
    console.log("Environment information for password reset:", envInfo);
    
    // Log the redirect URL that will be used - ensure it points to update-password
    const redirectUrl = getAuthRedirectUrl('/auth/update-password');
    console.log("Redirect URL for password reset:", redirectUrl);
  }, []);
  
  console.log("PasswordResetForm rendered with initialEmail:", initialEmail, "resetSent:", resetSent);
  
  if (resetSent) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            A password reset link has been sent to your email address. Please check your inbox and spam folders.
          </AlertDescription>
        </Alert>
        
        <Button
          type="button"
          variant="default"
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
          view="forgotten_password" 
          redirectTo="/auth/update-password"
          onSuccess={() => {
            console.log("Password reset email sent successfully");
            navigate('/auth?reset_sent=true');
          }}
          initialEmail={initialEmail}
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
  
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertDescription>
          The custom password reset form is currently unavailable. 
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
