import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { getAuthRedirectUrl } from "@/utils/environmentUtils";
import { LucideLoader2 } from "lucide-react";

interface PasswordResetFormProps {
  onClose: () => void;
}

export const PasswordResetForm = ({ onClose }: PasswordResetFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { handleResetPassword } = useAuthHandlers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await handleResetPassword(email);
      setSent(true);
      toast.success("Password reset link sent to your email!");
      
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {sent ? (
        <div className="text-center py-4">
          <div className="text-green-600 font-medium mb-2">
            Password reset link sent!
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Please check your email and click the link to reset your password.
          </p>
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold">Reset Password</h2>
          <p className="text-sm text-gray-600">
            Enter your email to receive a password reset link
          </p>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <div className="text-xs text-gray-500">
            You'll receive an email with instructions to reset your password.
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : "Send Reset Link"}
          </Button>
        </form>
      )}
    </div>
  );
};
