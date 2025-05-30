
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, User, ArrowRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface NoRoleWarningProps {
  onSignOut: () => Promise<void>;
}

export const NoRoleWarning = ({ onSignOut }: NoRoleWarningProps) => {
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleCompleteRegistration = () => {
    // Clear any stale registration state first
    localStorage.removeItem('registration_step');
    localStorage.removeItem('registration_user_role');
    localStorage.removeItem('registration_payment_complete');
    
    navigate("/register");
  };

  const handleRetryRoleCheck = async () => {
    setIsRetrying(true);
    // Force a page reload to re-check authentication state
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleSignOut = async () => {
    try {
      await onSignOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-6 p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Account Setup Incomplete</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account was created but the registration process is not complete.
          </p>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <User className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            To access your account, please complete the registration process including payment and care team assignment.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button
            onClick={handleCompleteRegistration}
            className="w-full bg-[#9b87f5] hover:bg-[#8b77e5] text-white"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Complete Registration
          </Button>
          
          <Button
            onClick={handleRetryRoleCheck}
            variant="outline"
            className="w-full"
            disabled={isRetrying}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Checking...' : 'Check Account Status'}
          </Button>
          
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            Sign Out & Use Different Account
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};
