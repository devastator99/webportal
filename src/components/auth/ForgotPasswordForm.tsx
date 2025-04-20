
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
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
        }
      });

      if (error) {
        console.error("OTP send error:", error);
        setError(error.message || "Failed to send OTP");
        return;
      }

      setShowOtpInput(true);
      toast.success('OTP has been sent to your email');
    } catch (error: any) {
      console.error("OTP send exception:", error);
      setError(error.message || 'Error sending OTP. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) {
        console.error("OTP verification error:", error);
        setError(error.message || "Failed to verify OTP");
        return;
      }

      if (!data.session) {
        setError("Invalid OTP");
        return;
      }

      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setError(updateError.message || "Failed to update password");
        return;
      }

      toast.success('Password has been updated successfully');
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Password reset error:", error);
      setError(error.message || 'Error updating password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">Reset Password</h2>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!showOtpInput ? (
        <>
          <p className="text-sm text-gray-600 text-center">
            Enter your email address to receive a one-time password.
          </p>
          <form onSubmit={handleSendOTP} className="space-y-4">
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
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 text-center">
            Enter the OTP sent to your email and your new password.
          </p>
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Enter OTP</label>
              <InputOTP 
                value={otp} 
                onChange={(value) => setOtp(value)}
                maxLength={6}
                render={({ slots }) => (
                  <InputOTPGroup>
                    {slots.map((slot, index) => (
                      <InputOTPSlot key={index} {...slot} />
                    ))}
                  </InputOTPGroup>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || otp.length !== 6 || !newPassword}
            >
              {loading ? 'Verifying...' : 'Update Password'}
            </Button>
          </form>
        </>
      )}
    </div>
  );
};
