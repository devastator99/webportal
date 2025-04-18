
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LucideLoader2 } from "lucide-react";

export const UpdatePasswordForm = () => {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully!", {
        description: "You can now log in with your new password"
      });
      
      // Clear any recovery tokens from URL
      navigate("/auth", { replace: true });
    } catch (error: any) {
      console.error("Update password error:", error);
      
      // Handle expired/invalid recovery token
      if (error.message?.toLowerCase().includes('invalid')) {
        setError("Password reset link has expired. Please request a new one.");
        toast.error("Reset link expired", {
          description: "Please request a new password reset link"
        });
        return;
      }

      setError(error.message || "Failed to update password");
      toast.error("Failed to update password", {
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
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400"
          disabled={loading}
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
            Updating Password...
          </span>
        ) : (
          "Update Password"
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
