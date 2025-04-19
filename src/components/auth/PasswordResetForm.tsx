
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LucideLoader2 } from "lucide-react";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";

export const PasswordResetForm = () => {
  const [useCustomForm, setUseCustomForm] = useState(false);
  const navigate = useNavigate();
  
  if (!useCustomForm) {
    return (
      <div className="space-y-4">
        <SupabaseAuthUI 
          view="forgotten_password" 
          onSuccess={() => navigate('/auth?reset_sent=true')}
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
        
        <div className="text-center mt-2 text-xs text-gray-500">
          <button 
            className="underline text-xs hover:text-gray-800" 
            onClick={() => setUseCustomForm(true)}
          >
            Use alternative form
          </button>
        </div>
      </div>
    );
  }
  
  // The original custom form implementation would go here as a fallback option
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
