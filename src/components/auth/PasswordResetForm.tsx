
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface PasswordResetFormProps {
  onClose: () => void;
}

export const PasswordResetForm = ({ onClose }: PasswordResetFormProps) => {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { handleResetPassword } = useAuthHandlers();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await handleResetPassword(email);
      toast.success("Reset code sent to your email!");
      setStep('code');
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    setLoading(true);
    try {
      await handleResetPassword(email);
      toast.success("Password updated successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold">Reset Password</h2>
          <p className="text-sm text-gray-600">
            Enter your email to receive a reset code
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
            {loading ? "Sending..." : "Send Reset Code"}
          </Button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold">Enter Reset Code</h2>
          <p className="text-sm text-gray-600">
            Enter the 6-digit code sent to your email
          </p>
          <InputOTP
            value={code}
            onChange={(value) => setCode(value)}
            maxLength={6}
            render={({ slots }) => (
              <InputOTPGroup className="gap-2">
                {slots.map((slot, index) => (
                  <InputOTPSlot key={index} {...slot} />
                ))}
              </InputOTPGroup>
            )}
          />
          <Button type="submit" className="w-full" disabled={code.length !== 6}>
            Verify Code
          </Button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold">Set New Password</h2>
          <p className="text-sm text-gray-600">
            Enter your new password
          </p>
          <Input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            required
            minLength={6}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      )}
    </div>
  );
};
