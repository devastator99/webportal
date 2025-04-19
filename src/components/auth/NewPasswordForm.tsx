
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { LucideLoader2 } from "lucide-react";

export const NewPasswordForm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { handleUpdatePassword } = useAuthHandlers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    // Confirm passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await handleUpdatePassword(password);
      if (result) {
        setSuccess(true);
        toast.success("Password updated successfully! Redirecting to login...");
      }
    } catch (error: any) {
      console.error("Password update failed:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-600 font-medium">
          Password updated successfully!
        </div>
        <div className="flex justify-center">
          <LucideLoader2 className="animate-spin text-purple-600 h-5 w-5" />
        </div>
        <p className="text-sm text-gray-600">
          Redirecting to login page...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold">Set New Password</h2>
        <p className="text-sm text-gray-600">
          Please enter your new password
        </p>
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            className="w-full"
          />
          <small className="text-gray-500">Password must be at least 6 characters</small>
        </div>
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          required
          className="w-full"
        />
        <Button 
          type="submit" 
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : "Set New Password"}
        </Button>
      </form>
    </div>
  );
};
