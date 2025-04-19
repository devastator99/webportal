
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { getAuthRedirectUrl } from "@/utils/environmentUtils";

interface PasswordResetFormProps {
  onClose: () => void;
}

export const PasswordResetForm = ({ onClose }: PasswordResetFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { handleResetPassword } = useAuthHandlers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await handleResetPassword(email);
      toast.success("Password reset link sent to your email!");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>
    </div>
  );
};
