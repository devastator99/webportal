
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const ForgotPasswordForm = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Sending password reset email to:", email);
      
      // Use Supabase's built-in password reset functionality with correct redirect
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) {
        console.error("Password reset error:", error);
        setError(error.message || "Failed to send password reset email");
        return;
      }
      
      // Success state
      setSuccess(true);
      toast.success('Password reset link has been sent to your email');
      
      // Close the form after a delay if onClose is provided
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error: any) {
      console.error("Password reset exception:", error);
      setError(error.message || 'Error sending password reset email. Please try again later.');
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
      
      {success ? (
        <div className="text-center text-green-600 p-4 bg-green-50 rounded-md">
          <p className="font-medium">Reset link sent!</p>
          <p className="text-sm mt-1">Please check your email inbox for instructions.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 text-center">
            Enter your email address to receive password reset instructions.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? 'Sending Instructions...' : 'Send Reset Instructions'}
            </Button>
          </form>
        </>
      )}
    </div>
  );
};
