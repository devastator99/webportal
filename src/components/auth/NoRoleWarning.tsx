
import { Button } from "@/components/ui/button";

interface NoRoleWarningProps {
  onSignOut: () => Promise<void>;
}

export const NoRoleWarning = ({ onSignOut }: NoRoleWarningProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">No Role Assigned</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account hasn't been assigned a role yet. Please contact an administrator or try signing in with a different account.
          </p>
        </div>
        <div className="mt-8">
          <Button
            onClick={onSignOut}
            className="w-full"
            variant="destructive"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
