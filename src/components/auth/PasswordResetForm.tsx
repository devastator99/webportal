
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LucideLoader2 } from "lucide-react";
import { getAuthRedirectUrl, getEnvironmentInfo } from "@/utils/environmentUtils";

export const PasswordResetForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Log environment info for debugging
      console.log("Environment information for password reset:", getEnvironmentInfo());
      
      // Use the helper function to get a validated redirect URL
      const redirectUrl = getAuthRedirectUrl('/auth?type=recovery');
      console.log("Password reset redirect URL:", redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) throw error;

      toast.success("Password reset link sent!", {
        description: "Check your email for the password reset link"
      });
      
      navigate("/auth?reset_sent=true");
    } catch (error: any) {
      console.error("Reset password error:", error);
      setError(error.message || "Failed to send reset link");
      toast.error("Failed to send reset link", { 
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400"
          disabled={loading}
          autoFocus
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-[#9b87f5] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-white"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending Reset Link...
          </span>
        ) : (
          "Send Reset Link"
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => navigate("/auth")}
        disabled={loading}
      >
        Back to Login
      </Button>
    </form>
  );
};
