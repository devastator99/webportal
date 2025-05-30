
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, User, ArrowRight, RefreshCw, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useRegistrationState } from "@/hooks/useRegistrationState";

interface NoRoleWarningProps {
  onSignOut: () => Promise<void>;
}

export const NoRoleWarning = ({ onSignOut }: NoRoleWarningProps) => {
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const { clearRegistrationState, fixStateIssues, debugMode } = useRegistrationState();

  const handleCompleteRegistration = () => {
    // Clear any stale registration state first
    clearRegistrationState();
    
    if (debugMode) {
      console.log('[NoRoleWarning] Navigating to registration with clean state');
    }
    
    navigate("/register");
  };

  const handleRetryRoleCheck = async () => {
    setIsRetrying(true);
    
    // Try to fix any state issues first
    const wasFixed = fixStateIssues();
    
    if (debugMode) {
      console.log('[NoRoleWarning] Retrying role check, state fixed:', wasFixed);
    }
    
    // Force a page reload to re-check authentication state
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleResetState = async () => {
    setIsResetting(true);
    
    try {
      // Clear all registration state
      clearRegistrationState();
      
      if (debugMode) {
        console.log('[NoRoleWarning] Reset all registration state');
      }
      
      // Wait a moment then reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error resetting state:", error);
      setIsResetting(false);
    }
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
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleRetryRoleCheck}
              variant="outline"
              className="flex-1"
              disabled={isRetrying}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Checking...' : 'Retry'}
            </Button>
            
            <Button
              onClick={handleResetState}
              variant="outline"
              className="flex-1"
              disabled={isResetting}
            >
              <RotateCcw className={`mr-2 h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
              {isResetting ? 'Resetting...' : 'Reset'}
            </Button>
          </div>
          
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
            If you continue to have issues, try the "Reset" option to clear any cached registration data.
          </p>
        </div>
      </div>
    </div>
  );
};
