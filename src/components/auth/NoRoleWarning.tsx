
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, User, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NoRoleWarningProps {
  onSignOut: () => Promise<void>;
}

export const NoRoleWarning = ({ onSignOut }: NoRoleWarningProps) => {
  const navigate = useNavigate();

  const handleCompleteRegistration = () => {
    navigate("/auth/register");
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
            onClick={onSignOut}
            variant="outline"
            className="w-full"
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
