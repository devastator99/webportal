
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { toast } from "sonner";
import { getAuthRedirectUrl, getEnvironmentInfo, getBaseUrl } from "@/utils/environmentUtils";
import { supabase } from "@/integrations/supabase/client";

interface PasswordResetFormProps {
  initialEmail?: string;
}

export const PasswordResetForm = ({ initialEmail = "" }: PasswordResetFormProps) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [useCustomForm, setUseCustomForm] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetSent = searchParams.get('reset_sent') === 'true';
  
  useEffect(() => {
    // Log environment info on component mount to help with debugging
    const envInfo = getEnvironmentInfo();
    console.log("Environment information for password reset:", envInfo);
    
    // IMPORTANT: Log the exact URL that will be used for password reset redirects
    const baseUrl = getBaseUrl();
    const redirectPath = '/auth/update-password';
    const redirectUrl = `${baseUrl}${redirectPath}`;
    console.log("Direct URL for password reset redirect:", redirectUrl);
    
    // Also log the URL from utility function for comparison
    const utilityRedirectUrl = getAuthRedirectUrl('/auth/update-password');
    console.log("Utility-generated URL for password reset:", utilityRedirectUrl);
  }, []);
  
  console.log("PasswordResetForm rendered with initialEmail:", initialEmail, "resetSent:", resetSent);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    setLoading(true);
    try {
      const baseUrl = getBaseUrl();
      const redirectPath = '/auth/update-password';
      const redirectUrl = `${baseUrl}${redirectPath}`;
      console.log("Sending password reset with redirect URL:", redirectUrl);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) throw error;
      
      toast.success("Password reset link sent to your email");
      navigate('/auth?reset_sent=true');
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };
  
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
        {/* Show custom form for directly testing the reset functionality */}
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        <p className="text-sm text-center mt-4 text-gray-600">
          Or use the Supabase UI component
        </p>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setUseCustomForm(true)}
        >
          Use Supabase Auth UI
        </Button>
        
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

        <Button
          type="button"
          variant="outline"
          className="w-full mt-2"
          onClick={() => setUseCustomForm(false)}
        >
          Use Custom Form
        </Button>
      </div>
    </div>
  );
};
