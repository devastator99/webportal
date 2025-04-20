
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export const ForgotPasswordForm = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [newPassword, setNewPassword] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Use Supabase's built-in password reset method
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin // Current app origin
      });

      if (error) {
        setError(error.message || "Failed to send password reset email");
        return;
      }

      toast.success('Password reset OTP sent to your email');
      setStage('otp');
    } catch (error: any) {
      console.error("Password reset request error:", error);
      setError(error.message || 'Error sending password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTPAndUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verify OTP and update password in one step
      const { data, error } = await supabase.auth.updateUser({
        email,
        password: newPassword
      });

      if (error) {
        setError(error.message || "Failed to update password");
        return;
      }

      toast.success('Password updated successfully');
      if (onClose) {
        setTimeout(onClose, 2000);
      }
    } catch (error: any) {
      console.error("Password update error:", error);
      setError(error.message || 'Error updating password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStage = () => (
    <form onSubmit={handleSendOTP} className="space-y-4">
      <p className="text-sm text-gray-600 text-center">
        Enter your email to receive a password reset link.
      </p>
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full"
        disabled={loading}
      />
      <Button 
        type="submit" 
        className="w-full"
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </Button>
    </form>
  );

  const renderPasswordUpdateStage = () => (
    <form onSubmit={handleVerifyOTPAndUpdatePassword} className="space-y-4">
      <p className="text-sm text-gray-600 text-center">
        Enter your new password
      </p>
      <Input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={6}
        className="w-full"
      />
      <Button 
        type="submit" 
        className="w-full"
        disabled={loading || !newPassword}
      >
        {loading ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">Reset Password</h2>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {stage === 'email' && renderEmailStage()}
      {stage === 'newPassword' && renderPasswordUpdateStage()}
    </div>
  );
};
