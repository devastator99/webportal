
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

  // Send OTP for password reset
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Call Supabase edge function to send OTP without token links
      const { data, error } = await supabase.functions.invoke('send-password-reset-email', {
        body: { email, resetUrl: window.location.origin }
      });

      if (error) {
        setError(error.message || "Failed to send OTP");
        return;
      }

      toast.success('Password reset OTP sent to your email');
      setStage('otp');
    } catch (error: any) {
      console.error("Password reset request error:", error);
      setError(error.message || 'Error sending OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and progress to password update
  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    
    setError(null);
    setStage('newPassword');
  };

  // Update password after OTP verification
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Call edge function to update password without token
      const { data, error } = await supabase.functions.invoke('update-password-without-token', {
        body: { email, otp, newPassword }
      });

      if (error || (data && data.error)) {
        setError((error?.message || data?.error || "Failed to update password"));
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

  // Render the email input stage
  const renderEmailStage = () => (
    <form onSubmit={handleSendOTP} className="space-y-4">
      <p className="text-sm text-gray-600 text-center">
        Enter your email to receive a password reset OTP.
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
        {loading ? 'Sending...' : 'Send OTP'}
      </Button>
    </form>
  );

  // Render the OTP verification stage
  const renderOTPStage = () => (
    <form onSubmit={handleVerifyOTP} className="space-y-4">
      <p className="text-sm text-gray-600 text-center">
        Enter the 6-digit OTP sent to your email.
      </p>
      <div className="flex justify-center">
        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button 
        type="submit" 
        className="w-full"
        disabled={loading || otp.length !== 6}
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </Button>
    </form>
  );

  // Render the new password input stage
  const renderPasswordUpdateStage = () => (
    <form onSubmit={handleUpdatePassword} className="space-y-4">
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
      {stage === 'otp' && renderOTPStage()}
      {stage === 'newPassword' && renderPasswordUpdateStage()}
    </div>
  );
};
